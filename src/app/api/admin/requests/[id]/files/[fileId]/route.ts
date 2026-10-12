import { NextResponse } from "next/server"
import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { readSqliteRequestAttachment } from "@/lib/database/sqlite-store"

export const runtime = "nodejs"

export async function GET(_request: Request, context: { params: Promise<{ id: string; fileId: string }> }) {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied
  const { id, fileId } = await context.params
  const file = await readSqliteRequestAttachment(id, fileId)
  if (!file) return NextResponse.json({ message: "Файл не найден" }, { status: 404 })
  return new Response(file.data, { headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="project-file"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } })
}
