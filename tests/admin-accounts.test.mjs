import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, basename, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
async function loadStore(database, key) {
  const previous = process.env.SQLITE_DATABASE_PATH
  process.env.SQLITE_DATABASE_PATH = database
  try { return await import('../src/lib/auth/admin-accounts.mjs?' + key) }
  finally {
    if (previous === undefined) delete process.env.SQLITE_DATABASE_PATH
    else process.env.SQLITE_DATABASE_PATH = previous
  }
}

async function cleanup(directory) {
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith('sib-trade-admin-')) throw new Error('Unsafe test cleanup path')
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}

test('admin persists with a salted hash and bootstrap never resets an existing password', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sib-trade-admin-'))
  const database = join(directory, 'catalog.sqlite')
  const { createAdminAccount, authenticateAdminAccount, hasAdminAccount } = await loadStore(database, 'persistence')
  const password = 'Local test password 2026!'
  try {
    assert.equal(hasAdminAccount(), false)
    const created = await createAdminAccount({ email: ' Admin@example.test ', password, name: 'Администратор' })
    assert.equal(created.created, true)
    assert.equal(created.user.email, 'admin@example.test')
    assert.equal(hasAdminAccount(), true)
    const db = new DatabaseSync(database, { readOnly: true })
    const row = db.prepare('SELECT * FROM admin_accounts').get()
    assert.notEqual(row.password_hash, password)
    assert.match(row.password_hash, /^scrypt-v1:[a-f0-9]{32}:[a-f0-9]{128}$/)
    db.close()
    assert.equal(Object.hasOwn(created.user, 'password_hash'), false)
    const loggedIn = await authenticateAdminAccount('ADMIN@example.test', password)
    assert.equal(loggedIn.id, created.user.id)
    assert.equal(Object.hasOwn(loggedIn, 'password_hash'), false)
    assert.equal(await authenticateAdminAccount('admin@example.test', 'Incorrect password'), null)
    assert.equal(await authenticateAdminAccount('missing@example.test', password), null)
    const duplicates = await Promise.all([1, 2].map(() => createAdminAccount({ email: 'admin@example.test', password: 'Changed seed password!' })))
    for (const duplicate of duplicates) {
      assert.equal(duplicate.created, false)
      assert.equal(duplicate.user.id, created.user.id)
    }
    assert.equal(await authenticateAdminAccount('admin@example.test', 'Changed seed password!'), null)
    assert.equal((await authenticateAdminAccount('admin@example.test', password)).id, created.user.id)
    const fresh = await loadStore(database, 'fresh')
    assert.equal((await fresh.authenticateAdminAccount('admin@example.test', password)).id, created.user.id)
    const other = await createAdminAccount({ email: 'second@example.test', password })
    const inspect = new DatabaseSync(database, { readOnly: true })
    assert.notEqual(inspect.prepare('SELECT password_hash FROM admin_accounts WHERE id = ?').get(other.user.id).password_hash, row.password_hash)
    inspect.close()
    await assert.rejects(createAdminAccount({ email: 'invalid', password: 'short' }))
  } finally { await cleanup(directory) }
})

test('simultaneous bootstrap requests create one stable account', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sib-trade-admin-race-'))
  const database = join(directory, 'catalog.sqlite')
  const { createAdminAccount } = await loadStore(database, 'race')
  try {
    const results = await Promise.all([1, 2, 3].map(() => createAdminAccount({ email: 'race@example.test', password: 'Race test password!' })))
    assert.equal(results.filter(result => result.created).length, 1)
    assert.equal(new Set(results.map(result => result.user.id)).size, 1)
  } finally { await cleanup(directory) }
})
