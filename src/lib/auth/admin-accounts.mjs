import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const hashOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
const dataDirectory = resolve(/*turbopackIgnore: true*/ process.env.SQLITE_DATA_DIR ?? process.env.CATALOG_DATA_DIR ?? process.env.ORDERS_DATA_DIR ?? join(process.cwd(), 'data'))
const databasePath = resolve(/*turbopackIgnore: true*/ process.env.SQLITE_DATABASE_PATH ?? join(dataDirectory, 'catalog.sqlite'))
let hashQueue = Promise.resolve()

/** @param {string} password @param {Buffer} salt */
function deriveKey(password, salt) {
  // Bound concurrent scrypt allocations on the small production VPS.
  const job = hashQueue.then(() => new Promise((accept, reject) => {
    scrypt(password, salt, 64, hashOptions, (error, key) => error ? reject(error) : accept(key))
  }))
  hashQueue = job.then(() => undefined, () => undefined)
  return job
}

/** @param {string} password */
async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt)
  return `scrypt-v1:${salt.toString('hex')}:${key.toString('hex')}`
}

/** @param {string} password @param {string} encoded */
async function matchesPassword(password, encoded) {
  const parts = encoded.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false
  const key = await deriveKey(password, Buffer.from(parts[1], 'hex'))
  return timingSafeEqual(key, Buffer.from(parts[2], 'hex'))
}

function connect() {
  mkdirSync(dirname(databasePath), { recursive: true })
  const db = new DatabaseSync(databasePath)
  try {
    db.exec('PRAGMA busy_timeout = 10000; PRAGMA journal_mode = WAL;')
    db.exec(`CREATE TABLE IF NOT EXISTS admin_accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`)
    return db
  } catch (error) { db.close(); throw error }
}

function publicAccount(row) {
  return { id: row.id, email: row.email, firstName: row.name, lastName: '', createdAt: row.created_at, updatedAt: row.updated_at }
}

/** @param {{email: string, password: string, name?: string}} account */
export async function createAdminAccount(account) {
  const email = account.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 || account.password.length < 8 || account.password.length > 1024) {
    throw new Error('Для администратора нужны корректный email и пароль длиной от 8 до 1024 символов')
  }
  const db = connect()
  try {
    const existing = db.prepare('SELECT * FROM admin_accounts WHERE email = ?').get(email)
    if (existing) return { created: false, user: publicAccount(existing) }
    const hash = await hashPassword(account.password)
    const now = new Date().toISOString()
    const result = db.prepare('INSERT OR IGNORE INTO admin_accounts (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), email, account.name?.trim().slice(0, 240) || 'Администратор', hash, now, now)
    const row = db.prepare('SELECT * FROM admin_accounts WHERE email = ?').get(email)
    return { created: result.changes === 1, user: publicAccount(row) }
  } finally { db.close() }
}

export async function ensureConfiguredAdminAccount() {
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return null
  return createAdminAccount({ email, password, name: process.env.ADMIN_NAME })
}

/** @param {string} email @param {string} password */
export async function authenticateAdminAccount(email, password) {
  if (password.length > 1024) return null
  const db = connect()
  let row
  try { row = db.prepare('SELECT * FROM admin_accounts WHERE email = ?').get(email.trim().toLowerCase()) }
  finally { db.close() }
  // Unknown users also perform scrypt so lookup timing does not reveal accounts.
  const hash = row?.password_hash ?? `scrypt-v1:${'0'.repeat(32)}:${'0'.repeat(128)}`
  const valid = await matchesPassword(password, hash)
  return row && valid ? publicAccount(row) : null
}

export function hasAdminAccount() {
  const db = connect()
  try { return Boolean(db.prepare('SELECT 1 FROM admin_accounts LIMIT 1').get()) }
  finally { db.close() }
}
