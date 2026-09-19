import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/lib/config"
import { formatPrice } from "@/lib/utils"
import { ProductGrid } from "@/components/products/product-grid"
import { NewsletterForm } from "@/components/layout/newsletter-form"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { productRepository, categoryRepository } from "@/lib/repositories"

export const metadata: Metadata = {
  title: "СИБ-ТРЕЙД — Металлоконструкции, сантехника и стройматериалы",
  description:
    "Изготовление металлоконструкций, продажа сантехники, строительных материалов и оборудования. Качество, надёжность, индивидуальный подход.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "СИБ-ТРЕЙД — Металлоконструкции, сантехника и стройматериалы",
    description:
      "Изготовление металлоконструкций, продажа сантехники, строительных материалов и оборудования.",
    type: "website",
    url: siteConfig.url,
  },
  keywords: [
    "металлоконструкции",
    "сантехника",
    "стройматериалы",
    "лестницы",
    "ворота",
    "заборы",
    "профнастил",
    "Новосибирск",
    "СИБ-ТРЕЙД",
  ],
}

export default async function HomePage() {
  const categories = await categoryRepository.list()
  const featuredProducts = await productRepository.getFeatured(4)


  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex h-[650px] items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/hero.png"
          alt=""
          fill
          className="object-cover blur-[2px] scale-105"
          priority
          sizes="100vw"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Бесплатная доставка от {formatPrice(siteConfig.freeShippingThreshold)}
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-white">
            СИБ-ТРЕЙД
          </h1>
          <p className="mt-6 text-xl text-white/80">
            Изготовление металлоконструкций, продажа сантехники и строительных материалов.
            Качество, надёжность, индивидуальный подход.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/shop">
                Перейти в каталог
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="border border-white text-white hover:bg-white/10 hover:text-white">
              <Link href="/contact">
                Связаться с нами
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Каталог по категориям
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Смотреть все
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/${category.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={category.image?.url ?? PLACEHOLDER_IMAGE}
                  alt={category.image?.alt ?? category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 16vw"
                />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-sm font-medium group-hover:underline">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Популярные товары
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Смотреть все
          </Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-neutral-50">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Нужна консультация?
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Наши специалисты помогут подобрать товары, рассчитать объёмы и оформить доставку.
            Работаем с физическими и юридическими лицами.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/contact">
                Связаться с нами
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/shop">
                Смотреть каталог
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Подпишитесь на рассылку
          </h2>
          <p className="mt-4 text-neutral-400">
            Узнавайте о новинках и специальных предложениях.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
