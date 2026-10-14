import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { spawn } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { createServer } from "node:net"
import { once } from "node:events"
import { DatabaseSync } from "node:sqlite"

const directory = mkdtempSync(join(tmpdir(), "sib-trade-requests-"))
const databasePath = join(directory, "test.sqlite")
const db = new DatabaseSync(databasePath)
db.exec("CREATE TABLE app_state (key TEXT PRIMARY KEY, payload TEXT NOT NULL)")
const seed = db.prepare("INSERT INTO app_state VALUES (?, ?)")
const catalog = JSON.parse(readFileSync("src/data/products.json", "utf8"))
catalog.products = catalog.products.filter((product) => product.status === "active").slice(0, 1)
seed.run("catalog", JSON.stringify(catalog))
seed.run("media_imported", "1")
for (const key of ["blog", "cases", "materials", "pages"]) seed.run(`content:${key}`, readFileSync(`src/data/${key}.json`, "utf8"))
db.close()
const socket = createServer().listen(0, "127.0.0.1")
await once(socket, "listening")
const port = socket.address().port
await new Promise((done) => socket.close(done))
const base = `http://127.0.0.1:${port}`
const secret = "integration-test-only-secret"
const signCookie = (role) => {
  const payload = Buffer.from(JSON.stringify({ role, expiresAt: Date.now() + 600000 })).toString("base64url")
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`
}
const adminCookie = signCookie("admin")
const headers = { Cookie: `sib_trade_session=${adminCookie}` }
let child
let output = ""
let browser

async function start() {
  child = spawn(process.execPath, [".next/standalone/server.js"], { cwd: process.cwd(), windowsHide: true, env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port), SQLITE_DATABASE_PATH: databasePath, AUTH_SESSION_SECRET: secret, TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "", DATABASE_URL: "", PGHOST: "" }, stdio: ["ignore", "pipe", "pipe"] })
  child.stdout.on("data", (chunk) => { output += chunk })
  child.stderr.on("data", (chunk) => { output += chunk })
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server stopped: ${output.slice(-2000)}`)
    try { if ((await fetch(`${base}/api/admin/requests?kind=contact`, { headers })).ok) return }
    catch { /* wait for startup */ }
    await new Promise((done) => setTimeout(done, 250))
  }
  throw new Error("Server startup timed out")
}

async function stop() {
  if (child && child.exitCode === null) { const stopped = once(child, "exit"); child.kill(); await stopped }
}

async function json(path, body, expected = 201, extraHeaders = {}) {
  const response = await fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...extraHeaders }, body: typeof body === "string" ? body : JSON.stringify(body) })
  const data = await response.json()
  assert.equal(response.status, expected, JSON.stringify(data))
  return data
}

async function list(kind) {
  const response = await fetch(`${base}/api/admin/requests?kind=${kind}`, { headers })
  assert.equal(response.status, 200)
  assert.match(response.headers.get("cache-control"), /no-store/)
  return response.json()
}

const contact = { name: "Тестовый клиент", company: "Тест", phone: "+79990000000", email: "test@example.com", subject: "Получить расчёт", message: "Тестовая заявка на поставку", preferredContact: "phone" }
const quote = { company: "Тест", inn: "", contactName: "Тестовый клиент", phone: "+79990000000", email: "test@example.com", comment: "", desiredTerm: "", preferredContact: "phone", items: [{ id: "item-1", productId: "test-product", variantId: "variant-1", name: "Скамейка", variantName: "", image: { url: "", alt: "" }, slug: "test-product", price: 100, quantity: 2, lineTotal: 200, currency: "RUB" }] }
const customFields = { name: "Тестовый клиент", phone: "+79990000000", email: "test@example.com", productType: "Уличная мебель", dimensions: "", material: "", finish: "", quantity: "2", comment: "По чертежу" }
const customForm = (fileName = "чертёж.pdf") => {
  const form = new FormData()
  for (const [key, value] of Object.entries(customFields)) form.append(key, value)
  form.append("files", new Blob(["%PDF-test-drawing"]), fileName)
  return form
}

try {
  await start()
  const receipt = await json("/api/contact", contact)
  assert.match(receipt.requestNumber, /^ST-\d{8}-[A-F0-9]{8}$/)
  await json("/api/contact", "broken json", 400)
  await json("/api/contact", { ...contact, phone: "" }, 400)
  await json("/api/quotes", { ...quote, email: "", preferredContact: "email" }, 400)
  await json("/api/quotes", { ...quote, items: [] }, 400)
  await json("/api/quotes", { ...quote, items: [{ ...quote.items[0], quantity: -1 }] }, 400)
  const quoteReceipt = await json("/api/quotes", { ...quote, email: "", status: "completed", id: "spoofed-id" })
  const quotes = await list("quote")
  assert.equal(quotes.total, 1)
  assert.equal(quotes.items[0].id, quoteReceipt.requestId)
  assert.equal(quotes.items[0].status, "submitted")
  assert.equal(quotes.items[0].data.email, "")
  assert.equal(quotes.items[0].data.items[0].price, 0)
  assert.equal(quotes.items[0].data.items[0].lineTotal, 0)
  assert.equal(quotes.items[0].data.items[0].priceOnRequest, true)
  const customResponse = await fetch(`${base}/api/custom-requests`, { method: "POST", body: customForm() })
  assert.equal(customResponse.status, 201)
  const customReceipt = await customResponse.json()
  assert.equal((await fetch(`${base}/api/custom-requests`, { method: "POST", body: customForm("script.exe") })).status, 400)
  const customs = await list("custom")
  const filePath = `/api/admin/requests/${customReceipt.requestId}/files/${customs.items[0].attachments[0].id}`
  for (const path of ["/api/admin/requests?kind=contact", filePath]) {
    assert.equal((await fetch(`${base}${path}`)).status, 401)
    assert.equal((await fetch(`${base}${path}`, { headers: { Cookie: `sib_trade_session=${signCookie("customer")}` } })).status, 401)
  }
  assert.equal((await fetch(`${base}/api/admin/requests/${receipt.requestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) })).status, 401)
  const fileResponse = await fetch(`${base}${filePath}`, { headers })
  assert.equal(fileResponse.status, 200)
  assert.equal(await fileResponse.text(), "%PDF-test-drawing")
  assert.match(fileResponse.headers.get("content-disposition"), /^attachment/)
  assert.equal((await fetch(`${base}${filePath.replace(customReceipt.requestId, receipt.requestId)}`, { headers })).status, 404)
  assert.equal((await fetch(`${base}/api/admin/requests/${receipt.requestId}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status: "processing" }) })).status, 200)
  assert.equal((await fetch(`${base}/api/admin/requests/${receipt.requestId}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status: "not-a-status" }) })).status, 400)
  await stop()
  await start()
  assert.equal((await list("contact")).items[0].status, "processing")
  assert.equal((await list("custom")).items[0].attachments.length, 1)
  assert.equal(await (await fetch(`${base}${filePath}`, { headers })).text(), "%PDF-test-drawing")
  console.log("PASS API: saving, validation, role protection, private files, status changes, persistence after restart")

  if (process.env.RUN_BROWSER === "1") {
    const { chromium } = await import("playwright")
    browser = await chromium.launch({ channel: "msedge", headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(`${base}/contact`)
    await page.locator("#contact-name").fill(contact.name)
    await page.locator("#contact-phone").fill(contact.phone)
    await page.locator("#contact-email").fill(contact.email)
    await page.locator("#contact-subject").selectOption({ label: contact.subject })
    await page.locator("#contact-message").fill(contact.message)
    await page.route("**/api/contact", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Тестовая ошибка сохранения" }) }))
    await page.locator("#contact-form button[type=submit]").click()
    await page.locator("#contact-form [role=alert]").waitFor()
    assert.equal(await page.locator("#contact-name").inputValue(), contact.name)
    await page.unroute("**/api/contact")
    await page.locator("#contact-form button[type=submit]").click()
    await page.locator("#contact-form [role=status]").waitFor()
    assert.match(await page.locator("#contact-form [role=status]").textContent(), /ST-\d{8}/)
    await page.goto(`${base}/custom`)
    for (const [key, value] of Object.entries(customFields)) {
      const locator = page.locator(`#custom-${key === "productType" ? "product-type" : key}`)
      if (key === "productType") await locator.selectOption({ label: value })
      else if (["material", "finish"].includes(key)) await locator.selectOption(value)
      else await locator.fill(value)
    }
    await page.locator("#custom-files").setInputFiles({ name: "чертёж.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-browser") })
    await page.locator("form button[type=submit]").click()
    await page.locator("form [role=status]").waitFor()
    assert.match(await page.locator("form [role=status]").textContent(), /ST-\d{8}/)
    await page.goto(`${base}/quote`)
    await page.evaluate((items) => localStorage.setItem("quote-storage", JSON.stringify({ state: { items }, version: 0 })), quote.items)
    await page.reload()
    for (const [key, value] of Object.entries({ company: quote.company, "contact-name": quote.contactName, phone: quote.phone, email: quote.email })) await page.locator(`#quote-${key}`).fill(value)
    await page.locator("form button[type=submit]").click()
    await page.getByRole("heading", { name: "Запрос КП принят" }).waitFor()
    assert.match(await page.locator("main [role=status]").textContent(), /ST-\d{8}/)
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("quote-storage")).state.items.length), 0)
    await context.addCookies([{ name: "sib_trade_session", value: adminCookie, url: base }])
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ["/contact", "/custom", "/quote"]) {
        if (path === "/quote") await page.evaluate((items) => localStorage.setItem("quote-storage", JSON.stringify({ state: { items }, version: 0 })), quote.items)
        await page.goto(`${base}${path}`)
        await page.locator("main form").waitFor()
        const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("body *")].filter((element) => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((element) => ({ tag: element.tagName, className: element.className, text: element.textContent.slice(0, 120) })) }))
        assert.ok(overflow.scrollWidth <= width + 1, `overflow: ${path} at ${width}: ${JSON.stringify(overflow)}`)
      }
      for (const path of ["/admin/contacts", "/admin/quotes", "/admin/custom-requests"]) {
        await page.goto(`${base}${path}`)
        await page.locator("article summary").first().waitFor()
        await page.locator("article summary").first().click()
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${path} at ${width}`)
      }
    }
    const summary = page.locator("article summary").first()
    await summary.focus()
    await page.keyboard.press("Tab")
    assert.equal(await page.evaluate(() => document.activeElement.tagName), "A")
    const status = page.getByRole("combobox", { name: /^Статус ST-/ }).first()
    await status.focus()
    assert.equal(await status.evaluate((element) => document.activeElement === element), true)
    await status.selectOption("processing")
    await page.waitForFunction(() => !document.querySelector('select[aria-label^="Статус ST-"]').disabled)
    assert.equal(await status.inputValue(), "processing")
    await page.screenshot({ path: join(directory, "admin-requests.png"), fullPage: true })
    assert.deepEqual(errors, [])
    console.log("PASS browser: errors preserve inputs, all 3 forms submit, quote confirms and clears, forms/admin at 320/768/1024/1440, keyboard focus and status update, no page errors")
    if (process.env.KEEP_TEST_OUTPUT === "1") console.log(`Screenshot: ${join(directory, "admin-requests.png")}`)
  }
} finally {
  await browser?.close()
  await stop()
  if (dirname(directory) !== resolve(tmpdir()) || !basename(directory).startsWith("sib-trade-requests-")) throw new Error("Unsafe cleanup path")
  if (process.env.KEEP_TEST_OUTPUT !== "1") rmSync(directory, { recursive: true })
}
