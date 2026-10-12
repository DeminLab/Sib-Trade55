import { NextResponse } from "next/server"
import { authorizeCatalogAdmin } from "@/lib/catalog/admin-api"
import { adminRepository } from "@/lib/repositories"

export const runtime = "nodejs"

export async function GET() {
  const denied = await authorizeCatalogAdmin()
  if (denied) return denied

  try {
    return NextResponse.json(await adminRepository.getDashboard(), {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch {
    return NextResponse.json({ message: "Не удалось прочитать каталог" }, { status: 500 })
  }
}
