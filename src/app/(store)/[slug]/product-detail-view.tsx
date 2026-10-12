"use client"
import { serializeJsonLd } from '@/lib/structured-data'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Heart,
  PackageCheck,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import { useRecentlyViewedStore } from "@/store/recently-viewed"
import { useQuoteStore } from "@/store/quote"
import { RecentlyViewed } from "@/components/products/recently-viewed"
import { ProductGallery } from "@/components/products/product-gallery"
import { VariantSelector } from "@/components/products/variant-selector"
import { QuantitySelector } from "@/components/products/quantity-selector"
import { ProductGrid } from "@/components/products/product-grid"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getProductMaterial, isPriceOnRequest } from "@/lib/product-presentation"
import { formatPrice } from "@/lib/utils"
import { siteConfig } from "@/lib/config"
import { breadcrumbJsonLd } from "@/lib/structured-data"
import type { Product, Brand, Category } from "@/types"

interface ProductDetailViewProps {
  product: Product
  relatedProducts: Product[]
  brand: Brand | null
  categoryAncestors?: Category[]
}

function getFinish(product: Product) {
  const text = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase()
  if (text.includes("порошков")) return "Порошковая окраска"
  if (text.includes("оцинков")) return "Оцинкованное покрытие"
  if (text.includes("хром")) return "Хромированное покрытие"
  if (text.includes("патин")) return "Патинирование"
  return "По согласованию"
}

function isMadeToOrder(product: Product) {
  const text = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase()
  return /изготов|индивиду|заказ|конструкц|лестниц|ворот|навес|каркас|арт-объект/.test(text)
}

function SectionTitle({ number, title, children }: { number: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="industrial-label">{number}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6 border-b border-border py-4 text-sm last:border-b-0 sm:grid-cols-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}

export function ProductDetailView({
  product,
  relatedProducts,
  brand,
  categoryAncestors = [],
}: ProductDetailViewProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "")
  const [quantity, setQuantity] = useState(1)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  const addToCart = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)
  const wishlistItems = useWishlistStore((state) => state.items)
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addItem)
  const addQuoteItem = useQuoteStore((state) => state.addItem)

  useEffect(() => {
    addRecentlyViewed({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.variants[0]?.price ?? 0,
      imageUrl: product.images[0]?.url ?? "",
      imageAlt: product.images[0]?.alt ?? product.name,
    })
  }, [addRecentlyViewed, product.id, product.images, product.name, product.slug, product.variants])

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId)
  if (!selectedVariant) return null

  const priceOnRequest = isPriceOnRequest(selectedVariant)
  const customProduct = isMadeToOrder(product) || priceOnRequest === true
  const stockQuantity = selectedVariant.inventory.quantity
  const available = !priceOnRequest && (stockQuantity > 0 || selectedVariant.inventory.allowBackorder)
  const stockLabel = stockQuantity > 0 ? "В наличии" : selectedVariant.inventory.allowBackorder ? "Под заказ" : "Нет в наличии"
  const leadTime = customProduct || stockLabel === "Под заказ" ? "По запросу" : stockQuantity > 0 ? "Готовое изделие" : "Уточнить срок"
  const isWishlisted = mounted && wishlistItems.some((item) => item.productId === product.id)
  const selectedOption = selectedVariant.options[0]
  const dimensions = selectedVariant.dimensions
    ? `${selectedVariant.dimensions.length} × ${selectedVariant.dimensions.width} × ${selectedVariant.dimensions.height}`
    : selectedOption?.name === "Размер" ? selectedOption.value : "По согласованию"

  function handleAddToCart() {
    if (!selectedVariant) return

    addToCart({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      variantName: selectedVariant.name,
      image: product.images[0] ?? { url: "", alt: product.name },
      slug: product.slug,
      price: selectedVariant.price,
      quantity,
    })
    openCart()
  }

  function handleToggleWishlist() {
    if (!selectedVariant) return

    if (isWishlisted) {
      removeFromWishlist(product.id)
      toast("Удалено из избранного")
      return
    }

    addToWishlist({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: selectedVariant.price,
      image: product.images[0] ?? { url: "", alt: product.name },
    })
    toast.success("Добавлено в избранное")
  }

  function handleQuoteRequest() {
    if (!selectedVariant) return
    addQuoteItem({
      id: selectedVariant.id,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variantName: selectedVariant.name,
      image: product.images[0] ?? { url: "", alt: product.name },
      slug: product.slug,
      price: selectedVariant.price,
      priceOnRequest,
      quantity,
      lineTotal: selectedVariant.price * quantity,
      currency: selectedVariant.currency,
    })
  }

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Каталог", href: "/shop" },
    ...categoryAncestors.map((category) => ({ name: category.name, href: `/${category.slug}` })),
    { name: product.name, href: `/${product.slug}` },
  ])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => new URL(image.url, siteConfig.url).toString()),
    url: new URL(`/${product.slug}`, siteConfig.url).toString(),
    sku: selectedVariant.sku,
    brand: brand ? { "@type": "Brand", name: brand.name } : undefined,
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    offers: priceOnRequest ? undefined : {
      "@type": "Offer",
      price: selectedVariant.price.toFixed(2),
      priceCurrency: selectedVariant.currency,
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: new URL(`/${product.slug}`, siteConfig.url).toString(),
      seller: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    },
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 pb-28 lg:pb-10 sm:px-8 lg:px-12 lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([jsonLd, breadcrumbLd]) }} />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink render={<Link href="/shop" />}>Каталог</BreadcrumbLink></BreadcrumbItem>
          {categoryAncestors.map((category, index) => <div key={category.id} className="contents"><BreadcrumbSeparator /><BreadcrumbItem>{index === categoryAncestors.length - 1 ? <BreadcrumbPage>{category.name}</BreadcrumbPage> : <BreadcrumbLink render={<Link href={`/${category.slug}`} />}>{category.name}</BreadcrumbLink>}</BreadcrumbItem></div>)}
          <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{product.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start"><ProductGallery images={product.images} productName={product.name} /></div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-5 border-b border-border pb-6">
            <div className="min-w-0"><p className="industrial-label">Каталог / {customProduct ? "поставка по согласованным параметрам" : "товар из каталога"}</p><h1 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-4xl">{product.name}</h1>{brand ? <Link href={`/${brand.slug}`} className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline">{brand.name}</Link> : null}</div>
            <button type="button" onClick={handleToggleWishlist} className="flex size-11 shrink-0 items-center justify-center border border-border transition-colors hover:border-primary hover:bg-accent" aria-label={isWishlisted ? "Удалить из избранного" : "Добавить в избранное"}><Heart className={`size-5 ${isWishlisted ? "fill-current text-wishlist" : "text-muted-foreground"}`} /></button>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-3xl font-semibold tracking-[-0.04em]">{priceOnRequest ? "Цена по запросу" : <>{formatPrice(selectedVariant.price, selectedVariant.currency)}</>}</p><p className="mt-2 text-sm text-muted-foreground">Цена и условия поставки подтверждаются перед заказом</p></div><div className="text-right text-sm"><p className="flex items-center justify-end gap-2 font-medium"><span className={`size-2 ${stockQuantity > 0 ? "bg-emerald-600" : "bg-primary"}`} />{stockLabel}</p><p className="mt-1 text-muted-foreground">Срок: {leadTime}</p></div></div>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{product.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 border-y border-border py-5 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Артикул</p><p className="mt-1 font-mono font-medium">{selectedVariant.sku}</p></div><div><p className="text-muted-foreground">Материал</p><p className="mt-1 font-medium capitalize">{(getProductMaterial(product, selectedVariant) ?? "Уточняется")}</p></div><div><p className="text-muted-foreground">Покрытие</p><p className="mt-1 font-medium">{getFinish(product)}</p></div></div>

          {product.variants.length > 1 ? <div className="mt-7"><VariantSelector variants={product.variants} selectedVariantId={selectedVariantId} onSelect={setSelectedVariantId} /></div> : null}

          <div className={`mt-8 border p-5 ${customProduct ? "border-primary/50 bg-accent/35" : "border-border bg-surface-subtle"}`}><div className="flex items-start gap-3"><PackageCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">{customProduct ? "Нужен точный расчёт?" : "Готовы оформить заказ?"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{customProduct ? "Пришлите чертёж, фото или ТЗ — уточним параметры и подготовим предложение." : "Выберите количество и добавьте изделие в корзину."}</p></div></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><QuantitySelector quantity={quantity} onQuantityChange={setQuantity} max={stockQuantity || 99} />{customProduct ? <><Button className="h-12 sm:flex-1" asChild><Link href="/quote" onClick={handleQuoteRequest}><FileText className="mr-2 size-4" />Запросить КП</Link></Button><Button variant="outline" className="sm:flex-1" onClick={handleAddToCart} disabled={!available}><ShoppingBag className="mr-2 size-4" />В корзину</Button></> : <><Button className="sm:flex-1" onClick={handleAddToCart} disabled={!available}><ShoppingBag className="mr-2 size-4" />{available ? "Добавить в корзину" : "Нет в наличии"}</Button><Button variant="outline" className="sm:flex-1" asChild><Link href="/quote" onClick={handleQuoteRequest}>Запросить КП</Link></Button></>}</div></div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16 grid gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div><SectionTitle number="01 / спецификация" title="Технические характеристики"><span className="font-mono text-xs text-muted-foreground">SKU {selectedVariant.sku}</span></SectionTitle><dl className="mt-2 border-y border-border"><SpecRow label="Артикул" value={selectedVariant.sku} /><SpecRow label="Вариант исполнения" value={selectedVariant.name} /><SpecRow label="Размеры" value={dimensions} /><SpecRow label="Материал" value={(getProductMaterial(product, selectedVariant) ?? "Уточняется")} /><SpecRow label="Покрытие" value={getFinish(product)} /><SpecRow label="Ключевая характеристика" value={selectedOption ? `${selectedOption.name}: ${selectedOption.value}` : "По согласованию"} /><SpecRow label="Комплектация" value={product.description.split(".")[0] || "По согласованию"} /><SpecRow label="Условия заказа" value={stockQuantity > 0 ? "В наличии" : "Условия поставки уточняются"} /></dl></div>
        <div className="space-y-5"><div className="border border-border bg-surface-subtle p-6"><Ruler className="size-6 text-primary" /><h3 className="mt-6 text-lg font-semibold">Размеры и варианты</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Проверим габариты и адаптируем исполнение под место установки. Для серийных позиций доступны варианты из каталога.</p></div><div className="border border-border p-6"><Wrench className="size-6 text-primary" /><h3 className="mt-6 text-lg font-semibold">Комплектация под задачу</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Для нестандартного проекта достаточно прислать исходные материалы — инженер уточнит узлы, покрытие и комплектность.</p><Link href="/custom#request" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Обсудить проект <ArrowRight className="size-4" /></Link></div></div>
      </section>

      {product.body ? <section className="mt-12 sm:mt-16 border-t border-border pt-16"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><SectionTitle number="02 / описание" title="О продукте" /></div><div className="blog-body max-w-3xl" dangerouslySetInnerHTML={{ __html: product.body }} /></div></section> : null}

      <section className="mt-12 sm:mt-16 grid gap-4 md:grid-cols-3"><div className="border border-border p-6"><ShieldCheck className="size-6 text-primary" /><h3 className="mt-6 font-semibold">Гарантия</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Гарантийные условия фиксируем в документах к заказу с учётом материала, покрытия и назначения изделия.</p></div><div className="border border-border p-6"><Truck className="size-6 text-primary" /><h3 className="mt-6 font-semibold">Доставка</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Рассчитаем доставку до объекта, согласуем транспорт и удобное время получения.</p></div><div className="border border-border p-6"><Clock3 className="size-6 text-primary" /><h3 className="mt-6 font-semibold">Сроки</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Точный срок поставки зависит от сложности, размеров и выбранного покрытия.</p></div></section>

      <section className="mt-12 sm:mt-16"><SectionTitle number="03 / помощь" title="Часто задаваемые вопросы" /><div className="mt-5 grid gap-x-12 md:grid-cols-2">{[["Можно ли изменить размеры изделия?", "Да. Для продукции под заказ согласуем размеры и конструктивные особенности до подтверждения заказа."], ["Как подобрать материал и покрытие?", "Ориентируемся на условия эксплуатации, нагрузку, внешний вид и бюджет проекта."], ["Что нужно прислать для расчёта?", "Чертёж, фото, эскиз или краткое описание задачи с примерными размерами."], ["Можно ли заказать монтаж?", "Для подходящих проектов организуем доставку и монтаж на объекте." ]].map(([question, answer]) => <details key={question} className="group border-b border-border"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-semibold marker:hidden">{question}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="pb-5 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></section>

      <section className="mt-12 sm:mt-16"><SectionTitle number="04 / подборка" title="Похожие изделия"><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold">Смотреть каталог <ArrowRight className="size-4" /></Link></SectionTitle>{relatedProducts.length > 0 ? <div className="mt-8"><ProductGrid products={relatedProducts} /></div> : <div className="mt-8 border border-border bg-surface-subtle p-8 text-sm text-muted-foreground">Подберём совместимые изделия и варианты исполнения под вашу задачу. <Link href="/contact" className="font-semibold text-foreground underline underline-offset-4">Запросить подбор</Link></div>}</section>
      <RecentlyViewed excludeProductId={product.id} />
      <div className="mt-12 sm:mt-16 border-t border-border pt-10 text-center"><CircleHelp className="mx-auto size-7 text-primary" /><h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">Нужна консультация по изделию?</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Отправьте задачу — поможем подобрать исполнение, рассчитать стоимость и подготовить заказ.</p><Button className="mt-6" asChild><Link href="/contact">Получить расчёт <ArrowRight className="ml-2 size-4" /></Link></Button></div>
      <div className="product-mobile-action fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <p className="text-sm font-semibold">{priceOnRequest ? "Цена по запросу" : formatPrice(selectedVariant.price, selectedVariant.currency)}</p>
        <Button asChild className="min-h-11"><Link href="/quote" onClick={handleQuoteRequest}>Запросить расчёт</Link></Button>
      </div>
    </div>
  )
}
