import { NextResponse } from "next/server"
import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { listSqliteRequests } from "@/lib/database/sqlite-store"
import { requestKindSchema } from "@/lib/requests/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const params = new URL(request.url).searchParams
  const kind = requestKindSchema.safeParse(params.get("kind"))
  const page = Number(params.get("page") ?? 1)
  const query = (params.get('q') ?? '').slice(0, 120)
  const status = params.get('status') ?? ''
  if (!['', 'submitted', 'processing', 'completed', 'cancelled'].includes(status)) return NextResponse.json({ message: 'Некорректный статус' }, { status: 400 })
  if (!kind.success || !Number.isSafeInteger(page) || page < 1 || page > 1000000) return NextResponse.json({ message: "Некорректные параметры" }, { status: 400 })
  try {
    const result = await listSqliteRequests(kind.data, page, 25, query, status)
    return NextResponse.json({ ...result, page, totalPages: Math.ceil(result.total / 25) }, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ message: "Не удалось загрузить заявки" }, { status: 500 })
  }
}
