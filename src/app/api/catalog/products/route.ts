import { NextResponse } from "next/server"

import { readCatalog } from "@/lib/catalog/catalog-store"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const ids = new Set(new URL(request.url).searchParams.getAll("id").slice(0, 100))
  if (!ids.size) return NextResponse.json({ items: [] })
  const { products } = await readCatalog()
  return NextResponse.json({ items: products.filter((product) => product.status === "active" && ids.has(product.id)) })
}
