"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ProductImage } from "@/types"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { getProductImageSurface } from "@/lib/product-image-surface"

interface ProductGalleryProps {
  images: ProductImage[]
  productName?: string
}

export function ProductGallery({ images, productName = "Product" }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const currentImage = images[selectedIndex]

  function showPreviousImage() {
    setSelectedIndex((index) => (index - 1 + images.length) % images.length)
  }

  function showNextImage() {
    setSelectedIndex((index) => (index + 1) % images.length)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className={`catalog-image-surface ${getProductImageSurface(productName)} relative aspect-square overflow-hidden border border-border/70`}>
        <Image
          src={currentImage?.url ?? PLACEHOLDER_IMAGE}
          alt={currentImage?.alt ?? productName}
          fill
          className="object-contain p-4"
          sizes="(max-width: 1024px) 100vw, 50vw"
          preload
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border border-border/70 bg-background/90 text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border border-border/70 bg-background/90 text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Следующее изображение"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 z-10 border border-border/70 bg-background/90 px-2 py-1 font-mono text-xs text-foreground" aria-live="polite">
              {selectedIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                `catalog-image-surface ${getProductImageSurface(productName)} relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition-colors`,
                selectedIndex === index
                  ? "border-foreground"
                  : "border-transparent hover:border-neutral-300"
              )}
              aria-label={`Просмотр изображения ${index + 1}`}
            >
              <Image
                src={image.url ?? PLACEHOLDER_IMAGE}
                alt={image.alt ?? `${productName} thumbnail ${index + 1}`}
                fill
                className="object-contain p-4"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
