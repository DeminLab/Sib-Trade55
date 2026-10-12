import { randomUUID } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"

import initialCatalog from "@/data/products.json"
import initialBlog from "@/data/blog.json"
import initialCases from "@/data/cases.json"
import initialMaterials from "@/data/materials.json"
import initialPages from "@/data/pages.json"
import type { Brand, Category, Order, Product, ProductImage } from "@/types"
import type { RequestRecord, RequestKind } from "@/lib/requests/types"

import { ensurePostgresSchema, getPostgresPool, hasPostgres } from "@/lib/database/postgres"

export interface CatalogData {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  [key: string]: unknown
}

const dataDirectory = resolve(/*turbopackIgnore: true*/ process.env.SQLITE_DATA_DIR ?? process.env.CATALOG_DATA_DIR ?? process.env.ORDERS_DATA_DIR ?? join(process.cwd(), "data"))
const databasePath = resolve(/*turbopackIgnore: true*/ process.env.SQLITE_DATABASE_PATH ?? join(dataDirectory, "catalog.sqlite"))
const legacyCatalogPath = resolve(/*turbopackIgnore: true*/ process.env.CATALOG_SEED_FILE ?? join(dataDirectory, "catalog.json"))
const legacyOrdersPath = join(/*turbopackIgnore: true*/ dataDirectory, "orders.json")
const legacyMediaDirectory = join(/*turbopackIgnore: true*/ dataDirectory, "catalog-media")
const publicProductImagesDirectory = join(/*turbopackIgnore: true*/ process.cwd(), "public", "images", "products")
const initialContent = {
  blog: initialBlog,
  cases: initialCases,
  materials: initialMaterials,
  pages: initialPages,
}

const globalSqlite = globalThis as typeof globalThis & {
  sibTradeDatabase?: DatabaseSync
  sibTradeDatabaseInitialization?: Promise<void>
  sibTradeDatabaseWriteQueue?: Promise<unknown>
}

function getDatabase() {
  if (globalSqlite.sibTradeDatabase) return globalSqlite.sibTradeDatabase

  mkdirSync(dirname(databasePath), { recursive: true })
  const db = new DatabaseSync(databasePath)
  try {
  // Set the busy handler before journal/schema changes: build workers open this file concurrently.
  db.exec("PRAGMA busy_timeout = 10000;")
  db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;")
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
    CREATE TABLE IF NOT EXISTS catalog_media (
      path TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_requests (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS customer_requests_kind_date_idx ON customer_requests (kind, created_at DESC);
    CREATE TABLE IF NOT EXISTS request_attachments (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES customer_requests(id),
      name TEXT NOT NULL,
      data BLOB NOT NULL
    );
  `)
  globalSqlite.sibTradeDatabase = db
  return db
  } catch (error) { db.close(); throw error }
}

function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, "utf8")) as T
}

function mediaType(path: string) {
  switch (path.slice(path.lastIndexOf(".")).toLowerCase()) {
    case ".jpg":
    case ".jpeg": return "image/jpeg"
    case ".png": return "image/png"
    case ".svg": return "image/svg+xml"
    case ".gif": return "image/gif"
    case ".avif": return "image/avif"
    case ".webp": return "image/webp"
    default: return "application/octet-stream"
  }
}

function forEachFile(directory: string, visit: (path: string) => void) {
  if (!existsSync(directory)) return
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) forEachFile(path, visit)
    else if (entry.isFile()) visit(path)
  }
}

function rewriteImageUrls(catalog: CatalogData) {
  const rewrite = (image: ProductImage) => {
    if (image.url.startsWith("/images/products/")) {
      image.url = `/api/catalog/media${image.url}`
    }
  }
  for (const product of catalog.products) {
    product.images?.forEach(rewrite)
    product.variants?.forEach((variant) => variant.images?.forEach(rewrite))
  }
}

function migrateLegacyMedia(db: DatabaseSync) {
  const insertMedia = db.prepare("INSERT OR IGNORE INTO catalog_media (path, content_type, data) VALUES (?, ?, ?)")
  forEachFile(legacyMediaDirectory, (path) => {
    const filename = relative(legacyMediaDirectory, path).split(sep).join("/")
    insertMedia.run(`uploads/${filename}`, mediaType(filename), readFileSync(path))
  })
  forEachFile(publicProductImagesDirectory, (path) => {
    const filename = relative(join(/*turbopackIgnore: true*/ process.cwd(), "public"), path).split(sep).join("/")
    if (filename.endsWith(".gitkeep")) return
    insertMedia.run(filename, mediaType(filename), readFileSync(path))
  })
}

async function migratePostgresData(): Promise<{ catalog: CatalogData | null; orders: Order[] | null }> {
  if (!hasPostgres) return { catalog: null, orders: null }

  await ensurePostgresSchema()
  const pool = getPostgresPool()
  const catalogResult = await pool.query<{ payload: CatalogData }>("SELECT payload FROM catalog_state WHERE id = 'main'")
  const orderResult = await pool.query<{ payload: Order }>("SELECT payload FROM orders ORDER BY created_at DESC")
  return {
    catalog: catalogResult.rows[0]?.payload ?? null,
    orders: orderResult.rows.map((row) => row.payload),
  }
}

async function initializeDatabase() {
  const db = getDatabase()
  const existingCatalogRow = db.prepare("SELECT payload FROM app_state WHERE key = 'catalog'").get() as { payload: string } | undefined
  const missingContent = Object.keys(initialContent).some((key) => !db.prepare("SELECT 1 FROM app_state WHERE key = ?").get(`content:${key}`))
  const mediaCount = (db.prepare("SELECT count(*) AS count FROM catalog_media").get() as { count: number }).count
  const missingMedia = !db.prepare("SELECT 1 FROM app_state WHERE key = 'media_imported'").get() && mediaCount === 0
  if (existingCatalogRow && !missingContent && !missingMedia) return

  const postgres = existingCatalogRow ? { catalog: null, orders: null } : await migratePostgresData()
  const catalog = postgres.catalog ?? (existingCatalogRow ? JSON.parse(existingCatalogRow.payload) as CatalogData : readJsonFile<CatalogData>(legacyCatalogPath) ?? structuredClone(initialCatalog) as CatalogData)
  const orders = postgres.orders ?? readJsonFile<Order[]>(legacyOrdersPath) ?? []
  rewriteImageUrls(catalog)

  db.exec("BEGIN IMMEDIATE")
  try {
    if (!db.prepare("SELECT 1 FROM app_state WHERE key = 'catalog'").get()) {
      migrateLegacyMedia(db)
      db.prepare("INSERT INTO app_state (key, payload) VALUES ('catalog', ?)").run(JSON.stringify(catalog))
      const insertOrder = db.prepare("INSERT OR IGNORE INTO orders (id, created_at, payload) VALUES (?, ?, ?)")
      for (const order of orders) insertOrder.run(order.id, order.createdAt, JSON.stringify(order))
    } else if (missingMedia) {
      migrateLegacyMedia(db)
    }
    const insertContent = db.prepare("INSERT OR IGNORE INTO app_state (key, payload) VALUES (?, ?)")
    for (const [key, value] of Object.entries(initialContent)) insertContent.run(`content:${key}`, JSON.stringify(value))
    db.prepare("INSERT OR REPLACE INTO app_state (key, payload) VALUES ('media_imported', '1')").run()
    db.prepare("INSERT OR REPLACE INTO app_state (key, payload) VALUES ('database_version', '2')").run()
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}

export async function ensureSqliteStore() {
  globalSqlite.sibTradeDatabaseInitialization ??= initializeWithRetry().catch((error: unknown) => {
    globalSqlite.sibTradeDatabaseInitialization = undefined
    throw error
  })
  await globalSqlite.sibTradeDatabaseInitialization
}

async function initializeWithRetry() {
  // Cold starts/build workers may compete with the initial media transaction.
  // Retry only SQLite locks, never silently bypass migration or other errors.
  for (let attempt = 0; ; attempt++) {
    try { await initializeDatabase(); return }
    catch (error) {
      const code = (error as { errcode?: number }).errcode
      if (![5, 6].includes(code ?? 0) || attempt >= 5) throw error
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
}

function withSqliteWrite<T>(operation: (db: DatabaseSync) => T | Promise<T>) {
  const db = getDatabase()
  const queued = (globalSqlite.sibTradeDatabaseWriteQueue ?? Promise.resolve()).then(async () => {
    await ensureSqliteStore()
    db.exec("BEGIN IMMEDIATE")
    try {
      const result = await operation(db)
      db.exec("COMMIT")
      return result
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }
  })
  globalSqlite.sibTradeDatabaseWriteQueue = queued.catch(() => undefined)
  return queued
}

export async function readSqliteCatalog<T = CatalogData>() {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const result = getDatabase().prepare("SELECT payload FROM app_state WHERE key = 'catalog'").get() as { payload: string } | undefined
  if (!result) throw new Error("SQLite catalog row is missing")
  return JSON.parse(result.payload) as T
}

export async function readSqliteContent<T>(key: keyof typeof initialContent): Promise<T> {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const row = getDatabase().prepare("SELECT payload FROM app_state WHERE key = ?").get(`content:${key}`) as { payload: string } | undefined
  if (!row) throw new Error(`SQLite content row is missing: ${key}`)
  const content = JSON.parse(row.payload)
  for (const key of Object.keys(content)) {
    if (Array.isArray(content[key])) content[key] = content[key].filter((item: { archived?: boolean }) => !item.archived)
  }
  return content as T
}

export function updateSqliteCatalog<T>(update: (catalog: CatalogData) => T | Promise<T>): Promise<T> {
  return withSqliteWrite(async (db) => {
    const row = db.prepare("SELECT payload FROM app_state WHERE key = 'catalog'").get() as { payload: string } | undefined
    if (!row) throw new Error("SQLite catalog row is missing")
    const catalog = JSON.parse(row.payload) as CatalogData
    const result = await update(catalog)
    db.prepare("UPDATE app_state SET payload = ? WHERE key = 'catalog'").run(JSON.stringify(catalog))
    return result
  })
}

export async function readSqliteOrders() {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  return getDatabase().prepare("SELECT payload FROM orders ORDER BY created_at DESC").all().map((row) => JSON.parse(String((row as { payload: string }).payload)) as Order)
}

export function insertSqliteOrder(order: Order) {
  return withSqliteWrite((db) => {
    db.prepare("INSERT INTO orders (id, created_at, payload) VALUES (?, ?, ?)").run(order.id, order.createdAt, JSON.stringify(order))
  })
}

export function updateSqliteOrder(id: string, status: Order["status"]) {
  return withSqliteWrite(db => {
    const row = db.prepare("SELECT payload FROM orders WHERE id = ?").get(id)
    if (!row) return null
    const order = { ...JSON.parse(String(row.payload)) as Order, status, updatedAt: new Date().toISOString() }
    db.prepare("UPDATE orders SET payload = ? WHERE id = ?").run(JSON.stringify(order), id)
    return order
  })
}

export async function readSqliteState<T>(key: string): Promise<T | null> {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const row = getDatabase().prepare("SELECT payload FROM app_state WHERE key = ?").get(key)
  return row ? JSON.parse(String(row.payload)) as T : null
}

// Compare the exact source to prevent overwriting edits from another tab/process.
export function writeSqliteState(key: string, value: unknown, expected: string | null) {
  return withSqliteWrite(db => {
    const row = db.prepare("SELECT payload FROM app_state WHERE key = ?").get(key)
    const current = row ? JSON.stringify(JSON.parse(String(row.payload))) : null
    if (current !== expected) return false
    db.prepare("INSERT INTO app_state(key, payload) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").run(key, JSON.stringify(value))
    return true
  })
}

export async function inspectSqliteStore() {
  await ensureSqliteStore()
  const db = getDatabase()
  const { statSync, statfsSync } = await import('node:fs')
  const counts = Object.fromEntries(['orders', 'customer_requests', 'request_attachments', 'catalog_media'].map(table => [table, Number(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n)]))
  const disk = statfsSync(/*turbopackIgnore: true*/ dirname(databasePath))
  return { counts, sizeBytes: statSync(/*turbopackIgnore: true*/ databasePath).size, walBytes: existsSync(/*turbopackIgnore: true*/ `${databasePath}-wal`) ? statSync(/*turbopackIgnore: true*/ `${databasePath}-wal`).size : 0,
    disk: { freeBytes: Number(disk.bavail) * Number(disk.bsize), totalBytes: Number(disk.blocks) * Number(disk.bsize) },
    // O(1) readiness; full integrity check is deliberately a maintenance command.
    readable: Boolean(db.prepare("SELECT 1 FROM app_state WHERE key='catalog'").get()) }
}

export async function readRequestStatistics() {
  await ensureSqliteStore()
  return getDatabase().prepare("SELECT created_at, json_extract(payload, '$.status') AS status, kind, json_extract(payload, '$.notificationStatus') AS notification FROM customer_requests ORDER BY created_at").all()
}

export async function readSqliteMedia(path: string) {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const row = getDatabase().prepare("SELECT content_type, data FROM catalog_media WHERE path = ?").get(path) as { content_type: string; data: Uint8Array } | undefined
  return row ? { contentType: row.content_type, data: new Uint8Array(row.data) } : null
}

export function writeSqliteMedia(path: string, contentType: string, data: Uint8Array) {
  return withSqliteWrite((db) => {
    db.prepare("INSERT OR REPLACE INTO catalog_media (path, content_type, data) VALUES (?, ?, ?)").run(path, contentType, data)
  })
}

export function removeSqliteMedia(path: string) {
  return withSqliteWrite((db) => {
    db.prepare("DELETE FROM catalog_media WHERE path = ?").run(path)
  })
}

export const createMediaFileName = () => `${randomUUID()}.webp`

export function insertSqliteRequest(record: RequestRecord, files: { id: string; name: string; data: Uint8Array }[] = []) {
  return withSqliteWrite((db) => {
    db.prepare("INSERT INTO customer_requests (id, kind, created_at, payload) VALUES (?, ?, ?, ?)").run(record.id, record.kind, record.createdAt, JSON.stringify(record))
    const insert = db.prepare("INSERT INTO request_attachments (id, request_id, name, data) VALUES (?, ?, ?, ?)")
    for (const file of files) insert.run(file.id, record.id, file.name, file.data)
  })
}

export async function listSqliteRequests(kind: RequestKind, page = 1, limit = 25, query = '', status = '') {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const db = getDatabase()
  if (query.trim()) {
    // SQLite's built-in lower() folds ASCII only; names/tasks are Russian.
    const needle = query.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')
    const candidates = db.prepare("SELECT payload FROM customer_requests WHERE kind = ? AND (? = '' OR json_extract(payload, '$.status') = ?) ORDER BY created_at DESC, id DESC").all(kind, status, status)
    const matched = candidates.filter(row => String(row.payload).toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(needle))
    return { total: matched.length, items: matched.slice((page - 1) * limit, page * limit).map(row => JSON.parse(String(row.payload)) as RequestRecord) }
  }
  const where = "kind = ? AND (? = '' OR instr(lower(payload), lower(?)) > 0) AND (? = '' OR json_extract(payload, '$.status') = ?)"
  const args = [kind, query, query, status, status]
  const total = Number(db.prepare(`SELECT count(*) AS total FROM customer_requests WHERE ${where}`).get(...args)?.total)
  const items = db.prepare(`SELECT payload FROM customer_requests WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).all(...args, limit, (page - 1) * limit).map((row) => JSON.parse(String(row.payload)) as RequestRecord)
  return { items, total }
}

export async function getSqliteRequest(id: string): Promise<RequestRecord | null> {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const row = getDatabase().prepare("SELECT payload FROM customer_requests WHERE id = ?").get(id)
  return row ? JSON.parse(String(row.payload)) as RequestRecord : null
}

export function updateSqliteRequest(id: string, changes: Partial<Pick<RequestRecord, "status" | "notificationStatus">>) {
  return withSqliteWrite((db) => {
    const row = db.prepare("SELECT payload FROM customer_requests WHERE id = ?").get(id)
    if (!row) return null
    const record = { ...JSON.parse(String(row.payload)) as RequestRecord, ...changes, updatedAt: new Date().toISOString() }
    db.prepare("UPDATE customer_requests SET payload = ? WHERE id = ?").run(JSON.stringify(record), id)
    return record
  })
}

export async function readSqliteRequestAttachment(requestId: string, fileId: string) {
  await ensureSqliteStore()
  await globalSqlite.sibTradeDatabaseWriteQueue
  const row = getDatabase().prepare("SELECT name, data FROM request_attachments WHERE request_id = ? AND id = ?").get(requestId, fileId) as { name: string; data: Uint8Array } | undefined
  return row ? { name: row.name, data: new Uint8Array(row.data) } : null
}
