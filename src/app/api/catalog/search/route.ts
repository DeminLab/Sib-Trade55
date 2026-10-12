import { NextResponse } from "next/server"

import { productRepository } from '@/lib/repositories'

export const runtime = "nodejs"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLocaleLowerCase("ru-RU") ?? ""
  if (!query) return NextResponse.json({ items: [] })
  const { items } = await productRepository.search(query, { page: 1, limit: 6 })
  return NextResponse.json({ items })
}
