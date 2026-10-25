import { NextResponse } from "next/server"
import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { listSqliteMobileNotifications } from "@/lib/database/sqlite-store"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied

  const params = new URL(request.url).searchParams
  if (params.get("initialize") === "true") {
    return NextResponse.json({ events: [], cursor: { createdAt: new Date().toISOString(), id: "" } }, { headers: { "Cache-Control": "private, no-store" } })
  }
  const afterAt = params.get("afterAt") ?? ""
  const afterId = params.get("afterId") ?? ""
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(afterAt) || !Number.isFinite(Date.parse(afterAt)) || afterId.length > 90) {
    return NextResponse.json({ message: "Некорректный курсор уведомлений" }, { status: 400 })
  }

  try {
    const events = await listSqliteMobileNotifications(afterAt, afterId)
    const last = events.at(-1)
    return NextResponse.json({ events, cursor: last ? { createdAt: last.createdAt, id: last.id } : { createdAt: afterAt, id: afterId } }, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ message: "Не удалось получить новые заявки" }, { status: 503 })
  }
}
