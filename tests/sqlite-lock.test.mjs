import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { DatabaseSync } from 'node:sqlite'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, join, dirname, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'
import ts from 'typescript'
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) { const path = resolve('src', specifier.slice(2)); return { url: pathToFileURL(path.endsWith('.json') ? path : `${path}.ts`).href, shortCircuit: true } }
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) { const path = resolve(dirname(fileURLToPath(context.parentURL)), specifier); if (existsSync(`${path}.ts`)) return { url: pathToFileURL(`${path}.ts`).href, shortCircuit: true } }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return { format: 'module', source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true }
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${readFileSync(fileURLToPath(url), 'utf8')}`, shortCircuit: true }
    return next(url, context)
  },
})
test('SQLite initialization recovers from another process holding a write lock beyond busy_timeout', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'sib-trade-lock-'))
  const databasePath = join(directory, 'qa-lock.sqlite')
  process.env.SQLITE_DATABASE_PATH = databasePath
  process.env.DATABASE_URL = ''; process.env.PGHOST = ''
  const seedDb = new DatabaseSync(databasePath)
  seedDb.exec('PRAGMA journal_mode=WAL; CREATE TABLE app_state(key TEXT PRIMARY KEY, payload TEXT NOT NULL)')
  const insert = seedDb.prepare('INSERT INTO app_state VALUES(?,?)')
  insert.run('catalog', JSON.stringify({ products: [], categories: [], brands: [] })); insert.run('media_imported', '1')
  for (const key of ['blog', 'cases', 'materials', 'pages']) insert.run(`content:${key}`, '{}')
  seedDb.close()
  const child = spawn(process.execPath, ['--input-type=module', '-e', "import {DatabaseSync} from 'node:sqlite'; const db=new DatabaseSync(process.argv[1]); db.exec('BEGIN IMMEDIATE'); console.log('locked'); setTimeout(()=>{db.exec('COMMIT');db.close()},11500)", databasePath], { stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    await once(child.stdout, 'data')
    const store = await import('../src/lib/database/sqlite-store.ts')
    await store.ensureSqliteStore()
    assert.deepEqual((await store.readSqliteCatalog()).products, [])
    global.sibTradeDatabase.close(); delete global.sibTradeDatabase
  } finally {
    if (child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done }
    if (dirname(directory) !== resolve(tmpdir()) || !basename(directory).startsWith('sib-trade-lock-')) throw new Error('Unsafe cleanup')
    rmSync(directory, { recursive: true })
  }
})
