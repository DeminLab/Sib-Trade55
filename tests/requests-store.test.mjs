import { test, after } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { resolve, join, dirname, basename } from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL, fileURLToPath } from "node:url"
import ts from "typescript"
import { DatabaseSync } from "node:sqlite"

// Run the real TypeScript store against a small isolated SQLite database.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const path = resolve("src", specifier.slice(2))
      return { url: pathToFileURL(path.endsWith(".json") ? path : `${path}.ts`).href, shortCircuit: true }
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const path = resolve(dirname(fileURLToPath(context.parentURL)), specifier)
      if (existsSync(`${path}.ts`)) return { url: pathToFileURL(`${path}.ts`).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith(".ts")) return { format: "module", source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, shortCircuit: true }
    if (url.includes("/src/data/") && url.endsWith(".json")) return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")}`, shortCircuit: true }
    return next(url, context)
  },
})
const directory = mkdtempSync(join(tmpdir(), "sib-trade-requests-"))
process.env.SQLITE_DATABASE_PATH = join(directory, "test.sqlite")
process.env.TELEGRAM_BOT_TOKEN = "test-token"
process.env.TELEGRAM_CHAT_ID = "test-chat"
const db = new DatabaseSync(process.env.SQLITE_DATABASE_PATH)
db.exec("CREATE TABLE app_state (key TEXT PRIMARY KEY, payload TEXT NOT NULL)")
const insert = db.prepare("INSERT INTO app_state VALUES (?, ?)")
insert.run("catalog", JSON.stringify({ products: [], categories: [], brands: [] }))
insert.run("media_imported", "1")
for (const key of ["blog", "cases", "materials", "pages"]) insert.run(`content:${key}`, "[]")
db.close()

const { createCustomerRequest, notifyCustomerRequest } = await import("../src/lib/requests/request-store.ts")
const { getSqliteRequest, readSqliteRequestAttachment } = await import("../src/lib/database/sqlite-store.ts")
const { readRequestBody, RequestBodyTooLargeError } = await import("../src/lib/requests/request-body.ts")
const originalFetch = global.fetch
after(() => {
  global.fetch = originalFetch
  global.sibTradeDatabase?.close()
  if (dirname(directory) !== resolve(tmpdir()) || !basename(directory).startsWith("sib-trade-requests-")) throw new Error("Unsafe cleanup path")
  rmSync(directory, { recursive: true })
})

test("Telegram failure does not lose a request; retry succeeds and a sent notification is not repeated", async () => {
  let calls = 0
  global.fetch = async () => { calls++; throw new Error("offline") }
  const receipt = await createCustomerRequest({ kind: "contact", data: { name: "Тест", phone: "+79990000000", email: "test@example.com", subject: "Расчёт", message: "Тестовая задача", preferredContact: "phone" } })
  assert.equal(receipt.success, true)
  const saved = await getSqliteRequest(receipt.requestId)
  assert.equal(saved.notificationStatus, "failed")
  assert.equal(saved.status, "submitted")
  assert.equal(saved.requestNumber, receipt.requestNumber)
  global.fetch = async (url, init) => {
    calls++
    assert.equal(url, "https://api.telegram.org/bottest-token/sendMessage")
    const body = JSON.parse(init.body)
    assert.equal(body.chat_id, "test-chat")
    assert.ok(body.text.includes(receipt.requestNumber))
    return Response.json({ ok: true })
  }
  assert.equal((await notifyCustomerRequest(receipt.requestId)).notificationStatus, "sent")
  assert.equal((await notifyCustomerRequest(receipt.requestId)).notificationStatus, "sent")
  assert.equal(calls, 2)
})

test("files and their owning request persist together; file lookup checks ownership", async () => {
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
  const receipt = await createCustomerRequest({ kind: "custom", data: { name: "Тест", phone: "+79990000000", email: "test@example.com", productType: "Навес", dimensions: "", material: "", finish: "", quantity: "2", comment: "" } }, [new File(["drawing-bytes"], "чертёж.pdf")])
  const saved = await getSqliteRequest(receipt.requestId)
  assert.equal(saved.notificationStatus, "not_configured")
  assert.equal(saved.attachments.length, 1)
  const file = await readSqliteRequestAttachment(receipt.requestId, saved.attachments[0].id)
  assert.equal(file.name, "чертёж.pdf")
  assert.equal(new TextDecoder().decode(file.data), "drawing-bytes")
  assert.equal(await readSqliteRequestAttachment("another-request", saved.attachments[0].id), null)
})

test("streaming body limit rejects oversized requests without trusting Content-Length", async () => {
  const request = new Request("http://localhost/", { method: "POST", body: "123456", headers: { "content-length": "1" } })
  await assert.rejects(readRequestBody(request, 5), RequestBodyTooLargeError)
})

test("callback accepts no email, requires a phone, and persists in the request inbox", async () => {
  const { contactRequestSchema } = await import("../src/lib/requests/validation.ts")
  const input = { name: "Тест звонка", phone: "+79990000000", email: "", subject: "Заказать звонок", message: "Прошу связаться со мной по телефону.", preferredContact: "phone" }
  const parsed = contactRequestSchema.parse(input)
  assert.equal(contactRequestSchema.safeParse({ ...input, phone: "123" }).success, false)
  assert.equal(contactRequestSchema.safeParse({ ...input, subject: "Вопрос по каталогу" }).success, false)
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
  const receipt = await createCustomerRequest({ kind: "contact", data: parsed })
  const saved = await getSqliteRequest(receipt.requestId)
  assert.equal(saved.data.email, "")
  assert.equal(saved.data.phone, input.phone)
  assert.equal(saved.data.subject, "Заказать звонок")
})

test("catalog filters exclude unknown prices and backorders from in-stock results; pagination advances", async () => {
  const { updateCatalog } = await import("../src/lib/catalog/catalog-store.ts")
  const { sqliteProductRepository: repository } = await import("../src/lib/repositories/sqlite-product-repository.ts")
  const product = (id, price, quantity, priceOnRequest = false) => ({
    id, slug: id, name: id, description: "", categoryIds: ["child"], tags: [], status: "active", images: [],
    variants: [{ price, priceOnRequest, inventory: { quantity, allowBackorder: true } }],
  })
  await updateCatalog((catalog) => {
    catalog.categories = [{ id: "parent", slug: "parent" }, { id: "child", slug: "child", parentId: "parent" }]
    catalog.products = [product("unknown-zero", 0, 0), product("cheap", 100, 0), product("stock", 200, 2), product("unknown-flag", 300, 0, true), { ...product("archived", 100, 1), status: "archived" }]
  })
  const priced = await repository.list({ category: "parent", priceRange: { min: 0, max: 250 } }, { field: "price", order: "asc" })
  assert.deepEqual(priced.items.map((item) => item.id), ["cheap", "stock"])
  assert.deepEqual((await repository.list({ inStock: true })).items.map((item) => item.id), ["stock"])
  for (const order of ["asc", "desc"]) {
    const result = await repository.list({}, { field: "price", order })
    assert.deepEqual(new Set(result.items.slice(-2).map((item) => item.id)), new Set(["unknown-zero", "unknown-flag"]))
  }
  const second = await repository.list({ category: "parent" }, { field: "price", order: "asc" }, { page: 2, limit: 1 })
  assert.equal(second.items[0].id, "stock")
  assert.equal(second.pagination.total, 4)
})
