import { NextResponse } from "next/server"
import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { getVisitReport } from "@/lib/analytics/visit-store"

export const runtime = "nodejs"

export async function GET() {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  try {
    return NextResponse.json(getVisitReport(), { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ message: "Не удалось получить журнал посещений." }, { status: 503 })
  }
}
