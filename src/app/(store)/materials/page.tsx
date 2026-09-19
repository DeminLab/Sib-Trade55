import type { Metadata } from "next"
import { ArrowRight, ClipboardList, Layers3, ShieldCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { MaterialSpecCard } from "@/components/materials/material-spec-card"
import { RalPalette } from "@/components/materials/ral-palette"
import { Button } from "@/components/ui/button"
import { materialRepository } from "@/lib/repositories"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Материалы и покрытия",
  description: "Технический каталог материалов, покрытий и цветов RAL для металлоизделий СИБ-ТРЕЙД.",
  alternates: { canonical: `${siteConfig.url}/materials` },
}

export default async function MaterialsPage() {
  const [materials, coatings, ralColors] = await Promise.all([
    materialRepository.listMaterials(),
    materialRepository.listCoatings(),
    materialRepository.listRalColors(),
  ])

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <section className="relative overflow-hidden border-y border-border bg-neutral-950 px-5 py-12 text-white sm:px-10 sm:py-16 lg:px-16"><Image src="/images/generated/showroom.png" alt="Шоурум сантехники и строительных материалов" fill className="object-cover opacity-35" sizes="(max-width: 1024px) 100vw, 1440px" /><div className="relative"><div className="max-w-4xl"><p className="industrial-label text-white/65">СИБ-ТРЕЙД / технический каталог</p><h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-7xl">Материалы и покрытия под условия эксплуатации</h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/75">Подбираем металл, защитную систему и цвет не по шаблону, а под задачу объекта: нагрузку, среду, срок службы, архитектуру и требования к обслуживанию.</p></div><div className="mt-10 grid gap-px border border-white/20 bg-white/20 sm:grid-cols-3"><div className="bg-neutral-950/75 p-5"><Layers3 className="size-5 text-primary" /><p className="mt-5 text-sm font-semibold">4 группы металла</p><p className="mt-1 text-xs text-white/65">От конструкционной стали до алюминия</p></div><div className="bg-neutral-950/75 p-5"><ShieldCheck className="size-5 text-primary" /><p className="mt-5 text-sm font-semibold">4 системы защиты</p><p className="mt-1 text-xs text-white/65">Для помещений, улицы и сложной среды</p></div><div className="bg-neutral-950/75 p-5"><ClipboardList className="size-5 text-primary" /><p className="mt-5 text-sm font-semibold">Подбор по проекту</p><p className="mt-1 text-xs text-white/65">Согласуем образцы до заказа</p></div></div></div></section>

      <section className="mt-20"><div className="flex items-end justify-between gap-6 border-b border-border pb-5"><div><p className="industrial-label">01 / металл</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Материалы</h2></div><span className="font-mono text-xs text-muted-foreground">{String(materials.length).padStart(2, "0")} позиций</span></div><div className="mt-8 grid gap-5 lg:grid-cols-2">{materials.map((item) => <MaterialSpecCard key={item.id} item={item} />)}</div></section>

      <section className="mt-24"><div className="flex items-end justify-between gap-6 border-b border-border pb-5"><div><p className="industrial-label">02 / защита поверхности</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Покрытия</h2></div><span className="font-mono text-xs text-muted-foreground">{String(coatings.length).padStart(2, "0")} позиций</span></div><div className="mt-8 grid gap-5 lg:grid-cols-2">{coatings.map((item) => <MaterialSpecCard key={item.id} item={item} />)}</div></section>

      <section className="mt-24 border-t border-border pt-12"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="industrial-label">03 / цветовая система</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Каталог RAL</h2><p className="mt-5 text-sm leading-6 text-muted-foreground">Выберите базовый оттенок для предварительного обсуждения проекта. Для серийных партий фиксируем цвет и фактуру в спецификации.</p></div><RalPalette colors={ralColors} /></div></section>

      <section className="mt-24 grid gap-10 border-y border-border py-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="industrial-label">04 / алгоритм подбора</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Как выбрать систему</h2></div><div className="grid gap-6 sm:grid-cols-3"><div><span className="font-mono text-xs text-primary">01</span><h3 className="mt-3 font-semibold">Среда</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Улица, помещение, влажность, химическая нагрузка и контакт с водой.</p></div><div><span className="font-mono text-xs text-primary">02</span><h3 className="mt-3 font-semibold">Нагрузка</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Вес, пролёт, ударные воздействия, интенсивность эксплуатации.</p></div><div><span className="font-mono text-xs text-primary">03</span><h3 className="mt-3 font-semibold">Внешний вид</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Цвет, фактура, блеск и требования к повторяемости в серии.</p></div></div></section>

      <section className="mt-20 flex flex-col items-start justify-between gap-6 border border-primary/30 bg-accent/30 p-7 sm:flex-row sm:items-center sm:p-10"><div><p className="industrial-label">Нужна спецификация?</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Подберём материал и покрытие под ваш объект</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Пришлите чертёж, фотографию или ТЗ — инженер предложит несколько вариантов с ограничениями и ориентировочным сроком.</p></div><Button className="shrink-0" asChild><Link href="/custom">Отправить задачу <ArrowRight className="ml-2 size-4" /></Link></Button></section>
    </div>
  )
}
