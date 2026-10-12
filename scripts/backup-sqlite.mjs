import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve(process.env.SQLITE_DATABASE_PATH ?? 'data/catalog.sqlite')
mkdirSync('data/backups', { recursive: true })
const target = resolve(`data/backups/catalog-${Date.now()}.sqlite`)
const db = new DatabaseSync(source)
db.exec('PRAGMA busy_timeout = 10000')
db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`)
const catalog = JSON.parse(db.prepare("SELECT payload FROM app_state WHERE key='catalog'").get().payload)
const counts = Object.fromEntries(['orders', 'customer_requests', 'request_attachments', 'catalog_media'].map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n]))
console.log(JSON.stringify({ backup: target, integrity: db.prepare('PRAGMA quick_check').get(), products: catalog.products.length, active: catalog.products.filter(p => p.status === 'active').length, categories: catalog.categories.length, ...counts }, null, 2))
db.close()
