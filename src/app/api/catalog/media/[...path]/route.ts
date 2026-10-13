import { NextResponse } from "next/server"

import { readSqliteMedia } from "@/lib/database/sqlite-store"
import { getImageVariant } from "@/lib/catalog/image-cache.mjs"
import { catalogImageWidths } from "@/lib/image-sizes"

export const runtime = "nodejs"

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (!path?.length || path.some((segment) => !/^[\p{L}\p{N}_.-]+$/u.test(segment) || segment === "." || segment === "..")) {
    return NextResponse.json({ message: "Изображение не найдено" }, { status: 404 })
  }

  const requestedPath = path.join("/")
  const storagePath = requestedPath.startsWith("images/products/") ? requestedPath : `uploads/${requestedPath}`
  const widthParameter = new URL(request.url).searchParams.get("w")
  const width = widthParameter === null ? null : Number(widthParameter)
  if (width !== null && (!/^\d+$/.test(widthParameter!) || !catalogImageWidths.has(width))) {
    return NextResponse.json({ message: "Недопустимый размер изображения" }, { status: 400 })
  }
  try {
    const image = width === null
      ? await readSqliteMedia(storagePath)
      : await getImageVariant(storagePath, width, async () => (await readSqliteMedia(storagePath))?.data ?? null)
        .then(data => data ? { data, contentType: "image/webp" } : null)
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
