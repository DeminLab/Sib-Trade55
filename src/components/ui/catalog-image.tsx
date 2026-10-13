"use client"

import Image, { type ImageLoaderProps, type ImageProps } from "next/image"

function catalogLoader({ src, width }: ImageLoaderProps) {
  return `${src}?w=${width}&v=1`
}

// Existing catalog URLs stay valid. Other assets use Next's default optimizer.
export default function CatalogImage(props: ImageProps) {
  const catalog = typeof props.src === "string" && props.src.startsWith("/api/catalog/media/") && !props.src.includes("?")
  return <Image {...props} alt={props.alt} loader={catalog && !props.unoptimized ? catalogLoader : props.loader} />
}
