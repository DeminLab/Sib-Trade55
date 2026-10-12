import { NextResponse } from "next/server"
import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { updateSqliteRequest } from "@/lib/database/sqlite-store"
import { notifyCustomerRequest } from "@/lib/requests/request-store"
import { requestStatusSchema } from "@/lib/requests/validation"
import { z } from "zod"

export const runtime = "nodejs"
const actionSchema = z.union([z.object({ status: requestStatusSchema }), z.object({ action: z.literal("retry_notification") })])

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const parsed = actionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: "Некорректное действие" }, { status: 400 })
  const { id } = await context.params
  try {
    const item = "status" in parsed.data ? await updateSqliteRequest(id, { status: parsed.data.status }) : await notifyCustomerRequest(id)
    if (!item) return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 })
    return NextResponse.json(item, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ message: "Не удалось обновить заявку" }, { status: 500 })
  }
}
