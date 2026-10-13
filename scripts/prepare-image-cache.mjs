import { DatabaseSync } from 'node:sqlite'
import { resolve, join } from 'node:path'
import { prepareImageVariants } from '../src/lib/catalog/image-cache.mjs'

// Only read originals; never change catalog records or image bytes.
const dataDirectory = resolve(process.env.SQLITE_DATA_DIR ?? process.env.CATALOG_DATA_DIR ?? process.env.ORDERS_DATA_DIR ?? 'data')
const db = new DatabaseSync(resolve(process.env.SQLITE_DATABASE_PATH ?? join(dataDirectory, 'catalog.sqlite')), { readOnly: true })
const all = process.argv.includes('--all')
const catalog = JSON.parse(db.prepare("SELECT payload FROM app_state WHERE key = 'catalog'").get()?.payload ?? '{}')
const paths = new Set()
function collect(value) {
  if (!value || typeof value !== 'object') return
  if (typeof value.url === 'string' && value.url.startsWith('/api/catalog/media/')) {
    const path = value.url.slice('/api/catalog/media/'.length).split('?')[0]
    paths.add(path.startsWith('images/products/') ? path : `uploads/${path}`)
  }
  for (const nested of Object.values(value)) collect(nested)
}
if (all) {
  for (const row of db.prepare('SELECT path FROM catalog_media').iterate()) paths.add(row.path)
} else {
  for (const product of catalog.products ?? []) {
    if (product.status === 'active') collect(product.images?.[0])
  }
  collect(catalog.categories)
}
let completed = 0
let failed = 0
try {
  for (const path of paths) {
    const row = db.prepare('SELECT data FROM catalog_media WHERE path = ?').get(path)
    if (!row) { failed++; continue }
    try { await prepareImageVariants(path, row.data); completed++ }
    catch { failed++; console.error(`Не удалось обработать: ${path}`) }
    if ((completed + failed) % 25 === 0) console.log(`Готово ${completed}; ошибок ${failed}; всего ${paths.size}`)
  }
} finally { db.close() }
console.log(`Готово ${completed}; ошибок ${failed}; всего ${paths.size}`)
if (failed) process.exitCode = 1
