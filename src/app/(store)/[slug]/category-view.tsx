import { serializeJsonLd } from '@/lib/structured-data'
import Link from "next/link"
import { breadcrumbJsonLd } from "@/lib/structured-data"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ProductGrid } from "@/components/products/product-grid"
import { Pagination } from "@/components/products/pagination"
import type { Category, Product, PaginationMeta } from "@/types"

import { CatalogControls } from "@/components/products/catalog-controls"
import { catalogSearchParams, type CatalogQuery } from "@/lib/catalog-query"
import { productCountLabel } from "@/lib/product-presentation"

interface CategoryViewProps {
  query?: CatalogQuery
  category: Category
  products: Product[]
  pagination: PaginationMeta
  subcategories?: Category[]
  ancestors?: Category[]
}

export function CategoryView({
  query = {},
  category,
  products,
  pagination,
  subcategories = [],
  ancestors = [],
}: CategoryViewProps) {
  // Full ancestor trail for breadcrumbs — e.g. Shop > Electronics > Headphones
  const trail = [
    { name: "Каталог", href: "/shop" },
    ...ancestors.map((c) => ({ name: c.name, href: `/${c.slug}` })),
  ]

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd(trail)),
        }}
      />
      {/* Breadcrumb — full ancestor trail */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/shop" />}>Каталог</BreadcrumbLink>
          </BreadcrumbItem>
          {ancestors.map((cat, idx) => {
            const isLast = idx === ancestors.length - 1
            return (
              <div key={cat.id} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{cat.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={`/${cat.slug}`} />}>
                      {cat.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mt-2">
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {productCountLabel(pagination.total)}
        </p>
      </div>

      <CatalogControls query={{ ...query, category: query.category ?? category.slug }} categories={[category, ...subcategories]} />

      {/* Products */}
      <div className="mt-6">
        <ProductGrid products={products} eagerImages />
      </div>

      {/* Pagination */}
      <div className="mt-12">
        <Pagination
          pagination={pagination}
          basePath={`/${category.slug}`}
          searchParams={catalogSearchParams(query)}
        />
      </div>
    </div>
  )
}
