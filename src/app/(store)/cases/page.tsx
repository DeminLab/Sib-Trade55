import type { Metadata } from "next"
import { ArrowRight, Factory } from "lucide-react"

import { CaseCard } from "@/components/cases/case-card"
import { CaseFilters } from "@/components/cases/case-filters"
import { Pagination } from "@/components/products/pagination"
import { Button } from "@/components/ui/button"
import { caseRepository } from "@/lib/repositories"
import { siteConfig } from "@/lib/config"
import Link from "next/link"

interface CasesPageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

export const metadata: Metadata = {
  title: "Реализованные проекты",
  description: "Проекты СИБ-ТРЕЙД: металлоконструкции, благоустройство, уличная мебель и нестандартные изделия.",
  alternates: { canonical: `${siteConfig.url}/cases` },
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const filters = params.category ? { category: params.category } : undefined
  const [{ items: projects, pagination }, categories] = await Promise.all([
    caseRepository.list(filters, { page, limit: 6 }),
    caseRepository.getCategories(),
  ])

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <section className="grid gap-10 border-b border-border pb-14 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div>
          <p className="industrial-label">СИБ-ТРЕЙД / портфолио</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.065em] min-[420px]:text-5xl sm:text-5xl">Проекты, где поставленные решения работают на задачу</h1>
        </div>
        <div className="lg:pb-1">
          <p className="max-w-xl text-base leading-7 text-muted-foreground">Показываем реализованные проекты и поставленные решения — от серийного благоустройства до нестандартных конструкций по чертежам и техническим заданиям.</p>
          <Button className="mt-7" asChild><Link href="/custom">Обсудить свой проект <ArrowRight className="ml-2 size-4" /></Link></Button>
        </div>
      </section>

      <div className="mt-10"><CaseFilters options={categories} activeCategory={params.category} /></div>

      {projects.length > 0 ? (
        <section className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-2">
          {projects.map((project, index) => <CaseCard key={project.id} project={project} featured={index === 0 && !params.category && page === 1} />)}
        </section>
      ) : (
        <div className="mt-10 border border-border bg-surface-subtle px-6 py-16 text-center"><Factory className="mx-auto size-8 text-primary" /><h2 className="mt-5 text-2xl font-semibold">Проектов в этой категории пока нет</h2><p className="mt-2 text-sm text-muted-foreground">Посмотрите все реализованные объекты или отправьте нам свою задачу.</p><Button className="mt-6" variant="outline" asChild><Link href="/cases">Показать все проекты</Link></Button></div>
      )}

      <div className="mt-16"><Pagination pagination={pagination} basePath="/cases" searchParams={params.category ? { category: params.category } : undefined} /></div>
    </div>
  )
}
