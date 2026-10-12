import type { Metadata } from "next"
import Link from "next/link"
import { productRepository, categoryRepository } from "@/lib/repositories"
import { ProductGrid } from "@/components/products/product-grid"
import { Pagination } from "@/components/products/pagination"
import { CatalogControls } from "@/components/products/catalog-controls"
import { parseCatalogQuery, catalogSearchParams, normalizeCatalogQuery, type CatalogQuery } from "@/lib/catalog-query"
import { productCountLabel } from "@/lib/product-presentation"

export const metadata: Metadata = {
  title: "Каталог",
  description: "Уличная мебель, оборудование для благоустройства и металлоконструкции. Подбор и поставка по России.",
  alternates: { canonical: "/shop" },
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogQuery> }) {
  const query = normalizeCatalogQuery(await searchParams)
  const options = parseCatalogQuery(query)
  const [result, allCategories] = await Promise.all([
    productRepository.list(options.filters, options.sort, options.pagination),
    categoryRepository.list(),
  ])
  const root = allCategories.find((category) => !category.parentId)
  const selected = allCategories.find((category) => category.slug === query.category)
  const categories = allCategories.filter((category) => category.id !== root?.id || category.id === selected?.id).sort((a, b) => a.order - b.order)
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <p className="industrial-label">Подбор и поставка оборудования</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Каталог товаров</h1>
      <p className="mt-2 text-sm text-muted-foreground">{productCountLabel(result.pagination.total)} · Добавляйте изделия в общий расчёт</p>
      <nav aria-label="Направления каталога" className="mt-5 flex flex-wrap gap-2">
        {categories.filter(c => c.parentId === root?.id || !c.parentId && c.id !== root?.id).map(c => <Link key={c.id} href={`/${c.slug}`} className="border border-border bg-background px-3 py-2 text-sm hover:border-primary focus-visible:outline-2">{c.name}</Link>)}
      </nav>
      <CatalogControls query={query} categories={categories} />
      <div className="mt-6"><ProductGrid products={result.items} /></div>
      <div className="mt-8"><Pagination pagination={result.pagination} basePath="/shop" searchParams={catalogSearchParams(query)} /></div>
      <aside className="mt-8 flex flex-col gap-3 border border-border bg-surface-subtle p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm">Не нашли нужное изделие? Подберём оборудование по списку или чертежам.</p><Link href="/custom" className="shrink-0 font-medium text-primary underline underline-offset-4">Отправить задачу на подбор</Link></aside>
    </div>
  )
}
