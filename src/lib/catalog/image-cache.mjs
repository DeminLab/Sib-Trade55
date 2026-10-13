import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

// Version this directory when changing the encoding recipe.
const directory = resolve(process.env.SQLITE_DATA_DIR ?? process.env.CATALOG_DATA_DIR ?? process.env.ORDERS_DATA_DIR ?? join(process.cwd(), 'data'), 'image-cache-v1')
const pending = new Map()
let queue = Promise.resolve()

/** @param {string} path @param {number} width */
function cachePath(path, width) {
  return join(directory, `${createHash('sha256').update(path).digest('hex')}-${width}.webp`)
}

/** @param {string} path @param {number} width */
export async function readImageVariant(path, width) {
  try {
    return await readFile(cachePath(path, width))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

/** @param {string} path @param {number} width @param {() => Promise<Uint8Array | null>} readSource */
export async function getImageVariant(path, width, readSource) {
  const cached = await readImageVariant(path, width)
  if (cached) return cached
  const key = cachePath(path, width)
  if (pending.has(key)) return pending.get(key)
  // One transformation at a time keeps memory/CPU use bounded on a small VPS.
  const job = queue.then(async () => {
    const existing = await readImageVariant(path, width)
    if (existing) return existing
    const source = await readSource()
    if (!source) return null
    const data = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer()
    await mkdir(directory, { recursive: true })
    const temporary = `${key}.${randomUUID()}.tmp`
    await writeFile(temporary, data)
    await rename(temporary, key)
    return data
  })
  pending.set(key, job)
  queue = job.then(() => undefined, () => undefined)
  try {
    return await job
  } finally {
    pending.delete(key)
  }
}

/** @param {string} path @param {Uint8Array} source */
export async function prepareImageVariants(path, source) {
  for (const width of [64, 128, 256, 384, 768, 1200]) {
    await getImageVariant(path, width, async () => source)
  }
}
