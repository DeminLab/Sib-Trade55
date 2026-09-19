"use client"

import { useSyncExternalStore, type MouseEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Heart, PackageCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { useWishlistStore } from "@/store/wishlist"
import { useQuoteStore } from "@/store/quote"
import { toast } from "sonner"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

const materialKeywords = [
  "нержавеющая сталь",
  "оцинкованная сталь",
  "сталь",
  "алюминий",
  "профнастил",
  "поликарбонат",
  "акрил",
  "хром",
] as const

function getProductMaterial(product: Product) {
  const searchableText = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase()
  return materialKeywords.find((material) => searchableText.includes(material)) ?? product.tags[0] ?? "Металл"
}

function getKeyCharacteristic(product: Product) {
  const option = product.variants[0]?.options[0]
  if (option) return `${option.name}: ${option.value}`

  return product.description.split(".")[0] || "Параметры по запросу"
}

function isMadeToOrder(product: Product) {
  const searchableText = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase()
  return /изготов|индивиду|заказ|конструкц|лестниц|ворот|навес|каркас|арт-объект/.test(searchableText)
}

function getAvailability(product: Product, madeToOrder: boolean) {
  if (madeToOrder) return "Под заказ"

  const inventory = product.variants[0]?.inventory
  if (!inventory) return "Уточнить наличие"
  if (inventory.quantity > 0) return "В наличии"
  if (inventory.allowBackorder) return "Под заказ"
  return "Уточнить наличие"
}

function getLeadTime(availability: string, madeToOrder: boolean) {
  if (madeToOrder || availability === "Под заказ") return "По запросу"
  if (availability === "В наличии") return "Готовое изделие"
  return "Уточнить срок"
}

export function ProductCard({ product }: ProductCardProps) {
  const defaultVariant = product.variants[0]
  const wishlistItems = useWishlistStore((state) => state.items)
  const addItem = useWishlistStore((state) => state.addItem)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const addQuoteItem = useQuoteStore((state) => state.addItem)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!defaultVariant) return null

  const price = defaultVariant.price
  const image = product.images[0]
  const madeToOrder = isMadeToOrder(product)
  const availability = getAvailability(product, madeToOrder)
  const leadTime = getLeadTime(availability, madeToOrder)

  const isWishlisted = mounted && wishlistItems.some((item) => item.productId === product.id)

  function handleQuoteRequest(event: MouseEvent<HTMLElement>) {
    event.stopPropagation()
    addQuoteItem({
      id: defaultVariant.id,
      productId: product.id,
      variantId: defaultVariant.id,
      name: product.name,
      variantName: defaultVariant.name,
      image: image ?? { url: PLACEHOLDER_IMAGE, alt: product.name },
      slug: product.slug,
      price,
      quantity: 1,
      lineTotal: price,
      currency: defaultVariant.currency,
    })
  }

  function handleWishlist(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (isWishlisted) {
      removeItem(product.id)
      toast("Удалено из избранного")
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: image ?? { url: PLACEHOLDER_IMAGE, alt: product.name },
    })
    toast.success("Добавлено в избранное")
  }

  return (
    <article className="group flex h-full flex-col border border-border bg-background transition-colors duration-300 hover:border-line-strong">
      <div className="relative aspect-[1.12] overflow-hidden bg-surface-subtle">
        <Link href={`/${product.slug}`} aria-label={`Подробнее: ${product.name}`} className="block h-full">
          <Image
            src={image?.url ?? PLACEHOLDER_IMAGE}
            alt={image?.alt ?? product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center border border-white/70 bg-white/90 text-foreground shadow-sm backdrop-blur transition-all hover:border-primary hover:bg-white"
          aria-label={isWishlisted ? "Удалить из избранного" : "Добавить в избранное"}
        >
          <Heart className={`size-[17px] transition-transform duration-300 ${isWishlisted ? "fill-current text-wishlist" : "text-foreground/65 group-hover:text-foreground"}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/${product.slug}`} className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.025em] transition-colors group-hover:text-primary">{product.name}</h3>
          </Link>
          {product.rating > 0 ? <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground" title={`${product.rating} из 5`}>★ {product.rating.toFixed(1)}</span> : null}
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4 text-xs">
          <div><dt className="text-muted-foreground">Наличие</dt><dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground"><span className={`size-1.5 ${availability === "В наличии" ? "bg-emerald-600" : "bg-primary"}`} />{availability}</dd></div>
          <div><dt className="text-muted-foreground">Срок поставки</dt><dd className="mt-1 font-medium text-foreground">{leadTime}</dd></div>
          <div><dt className="text-muted-foreground">Материал</dt><dd className="mt-1 truncate font-medium capitalize text-foreground">{getProductMaterial(product)}</dd></div>
          <div><dt className="text-muted-foreground">Характеристика</dt><dd className="mt-1 truncate font-medium text-foreground" title={getKeyCharacteristic(product)}>{getKeyCharacteristic(product)}</dd></div>
        </dl>

        <div className="mt-auto pt-5">
          <p className="text-xl font-semibold tracking-[-0.03em]">{madeToOrder ? "от " : ""}{formatPrice(price, defaultVariant.currency)}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:flex-1" asChild><Link href={`/${product.slug}`}>Подробнее <ArrowRight className="ml-2 size-4" /></Link></Button>
            {madeToOrder ? <Button className="w-full sm:flex-1" asChild><Link href="/quote" onClick={handleQuoteRequest}><PackageCheck className="mr-2 size-4" />Запросить КП</Link></Button> : null}
          </div>
        </div>
      </div>
    </article>
  )
}
