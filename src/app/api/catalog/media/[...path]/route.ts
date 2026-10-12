import { NextResponse } from "next/server"

import { readSqliteMedia } from "@/lib/database/sqlite-store"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (!path?.length || path.some((segment) => !/^[\p{L}\p{N}_.-]+$/u.test(segment) || segment === "." || segment === "..")) {
    return NextResponse.json({ message: "Изображение не найдено" }, { status: 404 })
  }

  const requestedPath = path.join("/")
  const storagePath = requestedPath.startsWith("images/products/") ? requestedPath : `uploads/${requestedPath}`
  try {
    const image = await readSqliteMedia(storagePath)
    if (!image) return NextResponse.json({ message: "Изображение не найдено" }, { status: 404 })
    return new Response(image.data, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return NextResponse.json({ message: "Изображение не найдено" }, { status: 404 })
  }
}
