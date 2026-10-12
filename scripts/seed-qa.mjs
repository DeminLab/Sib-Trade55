import { DatabaseSync } from 'node:sqlite'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
const target = resolve(process.argv[2] ?? 'data/qa-build.sqlite')
if (!basename(target).startsWith('qa-')) throw new Error('QA seed requires a qa- filename; never use a working database')
mkdirSync(dirname(target), { recursive: true })
const db = new DatabaseSync(target)
db.exec('PRAGMA busy_timeout=10000; CREATE TABLE IF NOT EXISTS app_state(key TEXT PRIMARY KEY, payload TEXT NOT NULL)')
const insert = db.prepare('INSERT OR REPLACE INTO app_state VALUES (?, ?)')
insert.run('catalog', readFileSync('src/data/products.json', 'utf8'))
insert.run('media_imported', '1')
for (const key of ['blog', 'cases', 'materials', 'pages']) insert.run(`content:${key}`, readFileSync(`src/data/${key}.json`, 'utf8'))
db.close()
console.log('QA build database initialized without importing public images')
