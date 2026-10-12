"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { Heart } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ProductCard } from "@/components/products/product-card"
import { useWishlistStore } from "@/store/wishlist"
import type { Product } from "@/types"

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((s) => s.items)
  const [productState, setProductState] = useState<{ key: string; items: Product[] }>({ key: "", items: [] })
  const wishlistKey = wishlistItems.map((item) => item.productId).sort().join(",")
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!mounted || !wishlistKey) return
    const params = new URLSearchParams()
    wishlistKey.split(",").forEach((id) => params.append("id", id))
    const controller = new AbortController()
    fetch(`/api/catalog/products?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ items: Product[] }> : Promise.reject(new Error("Could not load products")))
      .then((result) => setProductState({ key: wishlistKey, items: result.items }))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setProductState({ key: wishlistKey, items: [] }) })
    return () => controller.abort()
  }, [mounted, wishlistKey])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="Избранное" />
      </div>
    )
  }

  const wishlistedProducts = productState.key === wishlistKey ? productState.items : []

  if (wishlistedProducts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="Избранное" />
        <EmptyState
          icon={Heart}
title="Ваш список избранного пуст"
          description="Сохраняйте понравившиеся товары, чтобы найти их потом."
          actionLabel="Смотреть каталог"
          actionHref="/shop"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Избранное"
        description={`${wishlistedProducts.length} ${wishlistedProducts.length === 1 ? "товар" : "товаров"}`}
      />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
