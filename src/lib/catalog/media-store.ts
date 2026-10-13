import sharp from "sharp"

import { createMediaFileName, writeSqliteMedia } from "@/lib/database/sqlite-store"
import type { ProductImage } from "@/types"
import { prepareImageVariants } from "@/lib/catalog/image-cache.mjs"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export async function saveCatalogImage(file: File, alt: string): Promise<ProductImage> {
  if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Загрузите изображение размером до 10 МБ")
  }

  const filename = createMediaFileName()
  const output = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })

  await writeSqliteMedia(`uploads/${filename}`, "image/webp", output.data)
  // The original is already saved: a cache failure must not reject the upload.
  await prepareImageVariants(`uploads/${filename}`, output.data).catch(() => {
    console.error("Не удалось подготовить миниатюры; они будут созданы при просмотре")
  })

  return {
    url: `/api/catalog/media/${filename}`,
    alt: alt.trim().slice(0, 240) || "Изображение товара",
    width: output.info.width,
    height: output.info.height,
  }
}

export function isCatalogImageUrl(url: string) {
  return url.startsWith("/images/") || url.startsWith("/api/catalog/media/")
}
