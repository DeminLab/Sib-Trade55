import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { productRepository, categoryRepository, brandRepository } from "@/lib/repositories"
import { ProductDetailView } from "./product-detail-view"
import { CategoryView } from "./category-view"
import { BrandView } from "./brand-view"
import { siteConfig } from "@/lib/config"

import { parseCatalogQuery, normalizeCatalogQuery, type CatalogQuery } from "@/lib/catalog-query"

interface SlugPageProps {
  searchParams: Promise<CatalogQuery>
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params

  const product = await productRepository.getBySlug(slug)
  if (product) {
    const variant = product.variants[0]
    return {
      title: product.name,
      description: product.description,
      alternates: { canonical: `/${product.slug}` },
      openGraph: {
        title: product.name,
        description: product.description,
        type: "website",
        url: `${siteConfig.url}/${product.slug}`,
        images: product.images[0]
          ? [{ url: product.images[0].url, alt: product.images[0].alt }]
          : [],
      },
      other: {
        "product:price:amount": variant
          ? String(variant.price)
          : "",
        "product:price:currency": variant?.currency ?? "RUB",
      },
    }
  }

  const category = await categoryRepository.getBySlug(slug)
  if (category) {
    return {
      title: category.name,
      description: category.description,
      alternates: { canonical: `/${category.slug}` },
      openGraph: {
        title: category.name,
        description: category.description,
        type: "website",
        url: `${siteConfig.url}/${category.slug}`,
      },
    }
  }

  const brand = await brandRepository.getBySlug(slug)
  if (brand) {
    return {
      title: brand.name,
      description: brand.description,
      alternates: { canonical: `/${brand.slug}` },
      openGraph: {
        title: brand.name,
        description: brand.description,
        type: "website",
        url: `${siteConfig.url}/${brand.slug}`,
      },
    }
  }

  return { title: "Не найдено" }
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
  const { slug } = await params

  // Check product first
  const product = await productRepository.getBySlug(slug)
  if (product) {
    // Pick the most specific category (prefer one with a parentId, i.e. a subcategory)
    const productCategories = await Promise.all(
      product.categoryIds.map((id) => categoryRepository.getById(id))
    )
    const validCategories = productCategories.filter(
      (c): c is NonNullable<typeof c> => c !== null
    )
    const primaryCategory =
      validCategories.find((c) => c.parentId) ?? validCategories[0] ?? null

    const [relatedProducts, brand, categoryAncestors] = await Promise.all([
      primaryCategory
        ? productRepository
            .getByCategory(primaryCategory.slug, { page: 1, limit: 5 })
            .then((r) => r.items.filter((p) => p.id !== product.id).slice(0, 4))
        : Promise.resolve([]),
      brandRepository.getById(product.brandId),
      primaryCategory
        ? categoryRepository.getAncestors(primaryCategory.id)
        : Promise.resolve([]),
    ])

    return (
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        brand={brand}
        categoryAncestors={categoryAncestors}
      />
    )
  }

  // Check category
  const category = await categoryRepository.getBySlug(slug)
  if (category) {
    const query = normalizeCatalogQuery(await searchParams)
    const allCategories = await categoryRepository.list()
    const allowed = new Set([category.id])
    for (let changed = true; changed;) {
      changed = false
      for (const item of allCategories) {
        if (item.parentId && allowed.has(item.parentId) && !allowed.has(item.id)) { allowed.add(item.id); changed = true }
      }
    }
    const selected = allCategories.find(item => item.slug === query.category && allowed.has(item.id))
    const options = parseCatalogQuery(query, selected?.slug ?? slug)
    const [{ items: products, pagination }, subcategories, ancestors] =
      await Promise.all([
        productRepository.list(options.filters, options.sort, options.pagination),
        categoryRepository.getChildren(category.id),
        categoryRepository.getAncestors(category.id),
      ])
    return (
      <CategoryView
        query={query}
        category={category}
        products={products}
        pagination={pagination}
        subcategories={subcategories}
        ancestors={ancestors}
      />
    )
  }

  // Check brand
  const brand = await brandRepository.getBySlug(slug)
  if (brand) {
    const { items: products, pagination } = await productRepository.list(
      { brandId: brand.id },
      undefined,
      parseCatalogQuery(normalizeCatalogQuery(await searchParams)).pagination
    )
    return (
      <BrandView
        brand={brand}
        products={products}
        pagination={pagination}
      />
    )
  }

  notFound()
}
