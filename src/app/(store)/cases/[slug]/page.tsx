import { serializeJsonLd } from '@/lib/structured-data'
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react"

import { CaseCard } from "@/components/cases/case-card"
import { Button } from "@/components/ui/button"
import { caseRepository } from "@/lib/repositories"
import { breadcrumbJsonLd } from "@/lib/structured-data"
import { siteConfig } from "@/lib/config"

interface CaseDetailProps { params: Promise<{ slug: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const { items } = await caseRepository.list(undefined, { page: 1, limit: 10_000 })
  return items.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: CaseDetailProps): Promise<Metadata> {
  const { slug } = await params
  const project = await caseRepository.getBySlug(slug)
  if (!project) return { title: "Проект не найден" }
  return {
    title: project.title,
    description: project.excerpt,
    alternates: { canonical: `${siteConfig.url}/cases/${project.slug}` },
    openGraph: { title: project.title, description: project.excerpt, images: [{ url: project.coverImage.url, alt: project.coverImage.alt }] },
  }
}

export default async function CaseDetailPage({ params }: CaseDetailProps) {
  const { slug } = await params
  const project = await caseRepository.getBySlug(slug)
  if (!project) notFound()
  const related = await caseRepository.getRelated(project)

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd([{ name: "Проекты", href: "/cases" }, { name: project.title, href: `/cases/${project.slug}` }])) }} />
      <Link href="/cases" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> Все проекты</Link>

      <section className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle lg:aspect-[1.1]">
          <Image src={project.coverImage.url} alt={project.coverImage.alt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 65vw" />
        </div>
        <div className="pb-2"><p className="industrial-label">{project.category} / {project.year}</p><h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">{project.title}</h1><p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 text-primary" />{project.city}</p><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{project.description}</p><Button className="mt-8" asChild><Link href="/custom">Обсудить похожий проект <ArrowRight className="ml-2 size-4" /></Link></Button></div>
      </section>

      <section className="mt-24 grid gap-12 border-t border-border pt-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div><p className="industrial-label">01 / задача и решение</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">От запроса к готовому объекту</h2></div>
        <div className="grid gap-10 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Задача</p><p className="mt-4 text-base leading-7 text-muted-foreground">{project.task}</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Решение</p><p className="mt-4 text-base leading-7 text-muted-foreground">{project.solution}</p></div></div>
      </section>

      <section className="mt-24 grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div><p className="industrial-label">02 / спецификация</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Материалы и характеристики</h2></div>
        <div className="grid gap-10 md:grid-cols-2"><div><h3 className="text-sm font-semibold uppercase tracking-[0.12em]">Материалы</h3><ul className="mt-5 space-y-3">{project.materials.map((material) => <li key={material} className="flex items-center gap-3 border-b border-border pb-3 text-sm"><Check className="size-4 text-primary" />{material}</li>)}</ul></div><dl className="border-y border-border">{project.characteristics.map((item) => <div key={item.label} className="grid grid-cols-[0.8fr_1.2fr] gap-5 border-b border-border py-4 text-sm last:border-0"><dt className="text-muted-foreground">{item.label}</dt><dd className="font-medium">{item.value}</dd></div>)}</dl></div>
      </section>

      <section className="mt-24 border-t border-border pt-12"><div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="industrial-label">03 / поставка</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Этапы поставки</h2></div><ol className="grid gap-0 md:grid-cols-2">{project.productionStages.map((stage, index) => <li key={stage.title} className="border-b border-border py-6 first:border-t md:nth-[2]:border-t"><div className="flex gap-4"><span className="font-mono text-xs text-primary">0{index + 1}</span><div><h3 className="font-semibold">{stage.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.description}</p></div></div></li>)}</ol></div></section>

      <section className="mt-24"><div className="flex items-end justify-between gap-6 border-b border-border pb-5"><div><p className="industrial-label">04 / фото проекта</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Галерея</h2></div><span className="font-mono text-xs text-muted-foreground">{project.gallery.length} кадра</span></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{project.gallery.map((image) => <div key={image.url} className="relative aspect-[4/3] overflow-hidden bg-surface-subtle"><Image src={image.url} alt={image.alt} fill className="object-cover transition-transform duration-500 hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /></div>)}</div></section>

      <section className="mt-24 grid gap-10 border-y border-border py-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="industrial-label">05 / результат</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Что получили</h2></div><p className="max-w-3xl text-2xl font-medium leading-snug tracking-[-0.03em]">{project.result}</p></section>

      {related.length > 0 ? <section className="mt-24"><div className="flex items-end justify-between gap-6 border-b border-border pb-5"><div><p className="industrial-label">06 / подборка</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Похожие проекты</h2></div><Link href="/cases" className="hidden items-center gap-2 text-sm font-semibold sm:inline-flex">Все проекты <ArrowRight className="size-4" /></Link></div><div className="mt-8 grid gap-8 md:grid-cols-3">{related.map((item) => <CaseCard key={item.id} project={item} />)}</div></section> : null}
    </div>
  )
}
