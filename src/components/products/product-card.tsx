"use client"

import { useSyncExternalStore, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, Plus, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { useWishlistStore } from "@/store/wishlist"
import { useQuoteStore } from "@/store/quote"
import { toast } from "sonner"
import type { Product } from "@/types"
import { getAvailability, getProductMaterial, isPriceOnRequest } from "@/lib/product-presentation"
import { getProductImageSurface } from "@/lib/product-image-surface"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const defaultVariant = product.variants[0]
  const wishlistItems = useWishlistStore((state) => state.items)
  const addItem = useWishlistStore((state) => state.addItem)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const addQuoteItem = useQuoteStore((state) => state.addItem)
  const quoteItems = useQuoteStore((state) => state.items)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!defaultVariant) return null

  const price = defaultVariant.price
  const image = product.images[0]
  const priceOnRequest = isPriceOnRequest(defaultVariant)
  const availability = getAvailability(defaultVariant)
  const material = getProductMaterial(product)
  const option = defaultVariant.options.find((item) => /размер|длина|версия/i.test(item.name))
  const inQuote = mounted && quoteItems.some((item) => item.variantId === defaultVariant.id)

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
      priceOnRequest,
      quantity: 1,
      lineTotal: price,
      currency: defaultVariant.currency,
    })
    toast.success("Товар добавлен в расчёт", { action: { label: "Открыть", onClick: () => { router.push("/quote") } } })
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
    <article className="group grid h-full min-w-0 grid-cols-[6rem_minmax(0,1fr)] gap-3 border border-border bg-background p-3 transition-colors hover:border-line-strong min-[380px]:grid-cols-[7rem_minmax(0,1fr)] sm:flex sm:flex-col sm:gap-0 sm:p-0">
      <div className={`catalog-image-surface ${getProductImageSurface(product.name)} relative aspect-square self-start w-full overflow-hidden sm:aspect-[4/3]`}>
        <Link href={`/${product.slug}`} aria-label={`Подробнее: ${product.name}`} className="relative block h-full">
          <Image src={image?.url ?? PLACEHOLDER_IMAGE} alt={image?.alt ?? product.name} fill
            className="object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-[1.03] sm:p-5"
            sizes="(max-width: 640px) 112px, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        </Link>
        <button type="button" onClick={handleWishlist} aria-pressed={isWishlisted}
          className="absolute right-0 top-0 grid size-11 place-items-center bg-white/90 text-foreground transition-colors hover:bg-accent sm:right-2 sm:top-2"
          aria-label={isWishlisted ? "Удалить из избранного" : "Добавить в избранное"}>
          <Heart className={isWishlisted ? "size-4 fill-current text-wishlist" : "size-4"} aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:p-4">
        <p className="mb-2 text-xs text-muted-foreground">{availability}</p>
        <Link href={`/${product.slug}`} className="hover:text-primary">
          <h3 className="line-clamp-3 text-sm font-semibold leading-5 sm:line-clamp-2 sm:min-h-10 sm:text-base" title={product.name}>{product.name}</h3>
        </Link>
        {(material || option) ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{[material, option?.value].filter(Boolean).join(" · ")}</p> : null}
        <div className="mt-auto pt-3 sm:pt-4">
          <p className="text-base font-semibold tracking-tight sm:text-lg">{priceOnRequest ? "Цена по запросу" : formatPrice(price, defaultVariant.currency)}</p>
          {inQuote ? <Button variant="outline" className="mt-3 min-h-11 w-full px-2 text-xs sm:text-sm" asChild><Link href="/quote"><Check className="size-4" />В расчёте</Link></Button> :
            <Button onClick={handleQuoteRequest} className="mt-3 min-h-11 w-full px-2 text-xs sm:text-sm"><Plus className="size-4" />В расчёт</Button>}
        </div>
      </div>
    </article>
  )
}
