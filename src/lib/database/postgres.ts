import { Pool, type PoolClient } from "pg"

const globalPool = globalThis as typeof globalThis & { sibTradePostgresPool?: Pool }

export const hasPostgres = Boolean(process.env.DATABASE_URL || process.env.PGHOST)

export function getPostgresPool() {
  if (!hasPostgres) throw new Error("Set DATABASE_URL or PGHOST to use PostgreSQL")
  globalPool.sibTradePostgresPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
  return globalPool.sibTradePostgresPool
}

let schemaPromise: Promise<void> | null = null

export async function ensurePostgresSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const pool = getPostgresPool()
      await pool.query(`
        CREATE TABLE IF NOT EXISTS catalog_state (
          id text PRIMARY KEY,
          payload jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS orders (
          id uuid PRIMARY KEY,
          created_at timestamptz NOT NULL,
          payload jsonb NOT NULL
        );
        CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
      `)
    })().catch((error: unknown) => {
      schemaPromise = null
      throw error
    })
  }
  await schemaPromise
}

export async function withPostgresTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPostgresPool().connect()
  try {
    await client.query("BEGIN")
    const result = await operation(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
