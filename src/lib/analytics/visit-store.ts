import { randomUUID } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

export type VisitInput = {
  visitorId: string
  userId: string | null
  email: string | null
  page: string
  source: string
  device: string
  browser: string
  platform: string
  visitedAt: string
}

const dataDirectory = resolve(process.env.SQLITE_DATA_DIR ?? process.env.CATALOG_DATA_DIR ?? process.env.ORDERS_DATA_DIR ?? join(process.cwd(), "data"))
const databasePath = resolve(process.env.SQLITE_DATABASE_PATH ?? join(dataDirectory, "catalog.sqlite"))

function connect() {
  mkdirSync(dirname(databasePath), { recursive: true })
  const db = new DatabaseSync(databasePath)
  db.exec("PRAGMA busy_timeout = 10000; PRAGMA journal_mode = WAL;")
  db.exec(`CREATE TABLE IF NOT EXISTS site_visits (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    user_id TEXT,
    email TEXT,
    page TEXT NOT NULL,
    source TEXT NOT NULL,
    device TEXT NOT NULL,
    browser TEXT NOT NULL,
    platform TEXT NOT NULL,
    visited_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS site_visits_visitor_date_idx ON site_visits (visitor_id, visited_at);
  CREATE INDEX IF NOT EXISTS site_visits_date_idx ON site_visits (visited_at DESC);`)
  return db
}

export function recordVisit(visit: VisitInput) {
  const db = connect()
  try {
    db.prepare(`INSERT INTO site_visits (id, visitor_id, user_id, email, page, source, device, browser, platform, visited_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      randomUUID(), visit.visitorId, visit.userId, visit.email, visit.page,
      visit.source, visit.device, visit.browser, visit.platform, visit.visitedAt,
    )
  } finally { db.close() }
}

export function getVisitReport() {
  const db = connect()
  try {
    const summary = db.prepare(`SELECT COUNT(*) AS pageViews, COUNT(DISTINCT visitor_id) AS visitorCount FROM site_visits`).get() as { pageViews: number; visitorCount: number }
    const visitors = db.prepare(`WITH ordered AS (
      SELECT visitor_id, visited_at, LAG(visited_at) OVER (PARTITION BY visitor_id ORDER BY visited_at) AS previous_at
      FROM site_visits
    ), visit_counts AS (
      SELECT visitor_id, SUM(CASE WHEN previous_at IS NULL OR (julianday(visited_at) - julianday(previous_at)) * 1440 > 30 THEN 1 ELSE 0 END) AS visits
      FROM ordered GROUP BY visitor_id
    ), latest AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY visitor_id ORDER BY visited_at DESC) AS row_number,
        MIN(visited_at) OVER (PARTITION BY visitor_id) AS first_seen,
        COUNT(*) OVER (PARTITION BY visitor_id) AS page_views
      FROM site_visits
    )
    SELECT latest.visitor_id AS visitorId, latest.email, latest.first_seen AS firstSeen,
      latest.visited_at AS lastSeen, latest.page_views AS pageViews, visit_counts.visits,
      latest.page, latest.source, latest.device, latest.browser, latest.platform
    FROM latest JOIN visit_counts USING (visitor_id) WHERE latest.row_number = 1
    ORDER BY latest.visited_at DESC LIMIT 200`).all()
    return { ...summary, visitors: visitors as Array<Record<string, string | number | null>> }
  } finally { db.close() }
}
