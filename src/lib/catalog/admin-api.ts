import { NextResponse } from "next/server"

import { isCatalogAdmin } from "@/lib/catalog/admin-auth"
import { isCatalogImageUrl, saveCatalogImage } from "@/lib/catalog/media-store"
import { categoryInputSchema, productInputSchema } from "@/lib/catalog/admin-validation"

export class CatalogConflictError extends Error {}

export async function authorizeCatalogAdmin() {
  if (await isCatalogAdmin()) return null
  return NextResponse.json({ message: "Войдите в панель администратора" }, { status: 401 })
}

export async function readProductForm(request: Request) {
  const form = await request.formData()
  const rawPayload = form.get("payload")
  if (typeof rawPayload !== "string") return { error: "Не переданы данные товара" } as const

  let raw: unknown
  try {
    raw = JSON.parse(rawPayload)
  } catch {
    return { error: "Некорректные данные товара" } as const
  }
  const parsed = productInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля товара" } as const
  if ([...parsed.data.images, ...(parsed.data.variants ?? []).flatMap(v => v.images)].some((image) => !isCatalogImageUrl(image.url))) {
    return { error: "Можно использовать только загруженные изображения сайта" } as const
  }

  const files = form.getAll("images").filter((entry): entry is File => typeof entry !== "string" && entry.size > 0)
  if (files.length > 20 || files.some((file) => file.size > 10 * 1024 * 1024)) {
    return { error: "Можно загрузить до 20 изображений размером до 10 МБ каждое" } as const
  }
  try {
    const uploadedImages = await Promise.all(files.map((file) => saveCatalogImage(file, parsed.data.name)))
    return { data: { ...parsed.data, images: [...parsed.data.images, ...uploadedImages] } }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось обработать изображение" } as const
  }
}

export async function readCategoryForm(request: Request) {
  const form = await request.formData()
  const rawPayload = form.get("payload")
  if (typeof rawPayload !== "string") return { error: "Не переданы данные категории" } as const

  let raw: unknown
  try {
    raw = JSON.parse(rawPayload)
  } catch {
    return { error: "Некорректные данные категории" } as const
  }
  const parsed = categoryInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля категории" } as const
  if (parsed.data.image && !isCatalogImageUrl(parsed.data.image.url)) {
    return { error: "Можно использовать только загруженные изображения сайта" } as const
  }

  const files = form.getAll("image").filter((entry): entry is File => typeof entry !== "string" && entry.size > 0)
  if (files.length > 1) return { error: "Для категории можно загрузить одно изображение" } as const
  if (files[0]) {
    try {
      parsed.data.image = await saveCatalogImage(files[0], parsed.data.name)
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Не удалось обработать изображение" } as const
    }
  }
  return { data: parsed.data }
}
