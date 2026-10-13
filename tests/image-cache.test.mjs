import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

test('image variants deduplicate requests, preserve transparency and survive a fresh module', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sib-trade-images-'))
  const previous = process.env.SQLITE_DATA_DIR
  process.env.SQLITE_DATA_DIR = directory
  try {
    const cache = await import('../src/lib/catalog/image-cache.mjs?test')
    const source = await sharp({ create: { width: 800, height: 400, channels: 4, background: { r: 50, g: 100, b: 150, alpha: 0.5 } } }).png().toBuffer()
    let reads = 0
    const load = async () => { reads++; return source }
    const results = await Promise.all(Array.from({ length: 6 }, () => cache.getImageVariant('uploads/test.webp', 384, load)))
    assert.equal(reads, 1)
    for (const result of results) assert.deepEqual(result, results[0])
    const metadata = await sharp(results[0]).metadata()
    assert.equal(metadata.width, 384)
    assert.equal(metadata.height, 192)
    assert.equal(metadata.hasAlpha, true)
    const fresh = await import('../src/lib/catalog/image-cache.mjs?fresh')
    const persisted = await fresh.getImageVariant('uploads/test.webp', 384, async () => { throw new Error('Cache hit must not read SQLite') })
    assert.deepEqual(persisted, results[0])
    assert.equal(await cache.getImageVariant('missing.webp', 128, async () => null), null)
    await assert.rejects(cache.getImageVariant('broken.webp', 128, async () => Buffer.from('broken')))
    const recovered = await cache.getImageVariant('broken.webp', 128, load)
    assert.equal((await sharp(recovered).metadata()).width, 128)
    assert.equal((await sharp(await cache.getImageVariant('small.webp', 1200, load)).metadata()).width, 800)
  } finally {
    if (previous === undefined) delete process.env.SQLITE_DATA_DIR
    else process.env.SQLITE_DATA_DIR = previous
    await rm(directory, { recursive: true, force: true })
  }
})
