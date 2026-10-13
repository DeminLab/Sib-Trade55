import { managedPage } from '@/components/content/managed-page'
import type { Metadata } from "next"
import Link from "next/link"
import Image from "@/components/ui/catalog-image"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Factory,
  Layers3,
  Ruler,
  ShieldCheck,
} from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/products/product-grid"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { siteConfig } from "@/lib/config"
import { categoryRepository, productRepository, caseRepository } from "@/lib/repositories"
import { CaseCard } from "@/components/cases/case-card"

export const metadata: Metadata = {
  title: "СИБ-ТРЕЙД — продажа и поставка металлоизделий",
  description:
    "СИБ-ТРЕЙД продаёт и поставляет металлоконструкции, уличную мебель, арт-объекты и решения для благоустройства от проверенных поставщиков.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "СИБ-ТРЕЙД — продажа и поставка металлоизделий",
    description:
      "Металлоконструкции, уличная мебель, благоустройство и нестандартные изделия под задачу проекта.",
    type: "website",
    url: siteConfig.url,
  },
  keywords: [
    "продажа и поставка металлоизделий",
    "металлоконструкции на заказ",
    "уличная мебель",
    "благоустройство",
    "арт-объекты",
    "СИБ-ТРЕЙД",
    "Омск",
  ],
}

const processSteps = [
  ["01", "Заявка", "Вы оставляете запрос или техническое задание"],
  ["02", "Обсуждение", "Уточняем детали, материалы и ограничения"],
  ["03", "Расчёт", "Согласуем стоимость, сроки и состав работ"],
  ["04", "Поставка", "Проверяем комплектацию товара перед отгрузкой"],
  ["05", "Доставка", "Привозим на объект и помогаем с монтажом"],
] as const

const materials = [
  ["Черная сталь", "Прочная основа для конструкций", "/api/catalog/media/images/products/1767891212226-566564_medium.webp"],
  ["Нержавеющая сталь", "Для долговечных и декоративных решений", "/api/catalog/media/images/products/1767891133482-513300_medium.webp"],
  ["Алюминий", "Лёгкость и коррозионная стойкость", "/api/catalog/media/images/products/1767891298425-968037_medium.webp"],
  ["Оцинкованная сталь", "Защита в сложных условиях", "/api/catalog/media/images/products/1767892372211-18503_medium.webp"],
  ["Порошковая окраска", "Широкая палитра и стойкое покрытие", "/api/catalog/media/images/products/1767892372252-669767_medium.webp"],
  ["Патинирование", "Декоративный эффект для арт-объектов", "/api/catalog/media/images/products/1767892372296-327630_medium.webp"],
] as const

const values = [
  ["Комплексный подход", "От задачи до согласованной поставки", Ruler],
  ["Гибкость", "Реализуем типовые и нестандартные проекты", Layers3],
  ["Контроль качества", "На всех этапах поставки", ShieldCheck],
  ["Надёжная упаковка", "Сохраняем изделие при доставке", Factory],
  ["Партнёрский подход", "Долгосрочное сотрудничество", Check],
] as const

const faqs = [
  ["Работаете ли вы с частными заказчиками?", "Да. Берём в работу заказы для частных клиентов, бизнеса, застройщиков и муниципальных объектов."],
  ["Можно ли подобрать и поставить изделие по моему эскизу?", "Да. Достаточно прислать чертёж, фотографию, эскиз от руки или техническое задание — инженер уточнит детали. Разработка чертежей и дизайна выполняется за дополнительную стоимость по договорённости."],
  ["Какие сроки поставки?", "Срок зависит от сложности и объёма проекта. После обсуждения мы фиксируем реалистичный срок в расчёте."],
  ["Осуществляете ли вы монтаж?", "Для подходящих проектов организуем доставку и монтаж на объекте. Условия согласуем до подтверждения заказа."],
  ["Предоставляете ли вы гарантию?", "Да. Гарантийные условия фиксируются в документах к заказу и зависят от товара и производителя."],
  ["Какие материалы и покрытия доступны?", "Работаем с чёрной и нержавеющей сталью, алюминием, оцинковкой, порошковой окраской и декоративными покрытиями."],
] as const

function SectionHeading({
  eyebrow,
  title,
  text,
  href,
  linkLabel,
  light = false,
}: {
  eyebrow: string
  title: string
  text?: string
  href?: string
  linkLabel?: string
  light?: boolean
}) {
  return (
    <div className={`flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between ${light ? "border-white/25" : "border-border"}`}>
      <div className="max-w-2xl">
        <p className={`industrial-label ${light ? "text-white/65" : ""}`}>{eyebrow}</p>
        <h2 className={`mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl ${light ? "text-white" : ""}`}>{title}</h2>
        {text ? <p className={`mt-4 max-w-xl text-base leading-7 ${light ? "text-white/75" : "text-muted-foreground"}`}>{text}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link className={`group inline-flex shrink-0 items-center gap-2 text-sm font-semibold ${light ? "text-white" : "text-foreground"}`} href={href}>
          {linkLabel}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      ) : null}
    </div>
  )
}

export default async function HomePage() {
  const override = await managedPage('home')
  if (override) return override
  const [categories, featuredProducts, projects] = await Promise.all([
    categoryRepository.list(), productRepository.getFeatured(4), caseRepository.list(undefined, { page: 1, limit: 3 }),
  ])
  const root = categories.find((category) => !category.parentId)
  const directions = categories.filter((category) => category.parentId === root?.id).sort((a, b) => a.order - b.order)
  return (
    <div className="bg-background">
      <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
        <Image src="/images/hero-park-composite.webp" alt="" fill preload className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-neutral-950/60" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">СИБ-ТРЕЙД · продажа и поставка</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">Оборудование для благоустройства и металлоизделия</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/85">Уличная мебель, освещение, конструкции и решения под ваш проект. Подберём изделия и организуем поставку по России.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/shop">Выбрать в каталоге <ArrowRight className="size-4" /></Link></Button>
            <Button size="lg" variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white hover:text-foreground" asChild><Link href="/custom#request">Получить расчёт</Link></Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/25 pt-5 text-sm text-white/85"><span>Подбор по чертежам и ТЗ</span><span>Доставка по России</span><span>Для бизнеса и частных клиентов</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <SectionHeading eyebrow="01 / каталог" title="Выберите направление" href="/shop" linkLabel="Весь каталог" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5">
          {directions.map((category) => <Link key={category.id} href={`/${category.slug}`} className="group flex min-w-0 flex-col border border-border bg-white transition-colors hover:border-primary">
            <div className="relative aspect-[4/3] bg-surface-subtle"><Image src={category.image?.url ?? PLACEHOLDER_IMAGE} alt={category.image?.alt || category.name} fill className="object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-[1.03] sm:p-6" sizes="(max-width: 640px) 50vw, 33vw" /></div>
            <div className="flex flex-1 items-center justify-between gap-2 p-3 sm:p-5"><h3 className="text-sm font-semibold leading-5 sm:text-lg">{category.name}</h3><ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true" /></div>
          </Link>)}
        </div>
        <div className="mt-5 flex flex-col gap-4 border border-primary/25 bg-accent/40 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Нужен подбор по техническому заданию?</h3><p className="mt-1 text-sm text-muted-foreground">Пришлите описание, чертёж или фото — поможем с комплектацией.</p></div><Button variant="outline" asChild><Link href="/custom#request">Получить расчёт <ArrowUpRight className="size-4" /></Link></Button></div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-10 sm:px-8 lg:px-12 lg:pb-16"><SectionHeading eyebrow="02 / подборка" title="Популярные изделия" href="/shop" linkLabel="Смотреть каталог" /><div className="mt-6"><ProductGrid products={featuredProducts} /></div></section>

      {projects.items.length > 0 ? <section className="section-rule bg-surface-subtle"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16"><SectionHeading eyebrow="03 / портфолио" title="Проекты и поставленные решения" href="/cases" linkLabel="Все проекты" /><div className="mt-6 grid gap-7 md:grid-cols-3">{projects.items.map((project) => <CaseCard key={project.id} project={project} />)}</div></div></section> : null}

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16"><SectionHeading eyebrow="04 / процесс" title="От заявки до поставки" /><ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{processSteps.map(([number, title, text]) => <li key={number} className="flex gap-4 border-t border-border pt-4 lg:block"><span className="font-mono text-sm text-primary">{number}</span><div><h3 className="font-semibold lg:mt-4">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></li>)}</ol></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16"><SectionHeading eyebrow="05 / материалы" title="Материалы и покрытия" href="/materials" linkLabel="Подробнее о материалах" /><div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3">{materials.map(([title, text]) => <div key={title} className="border-l-2 border-primary/30 pl-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16"><SectionHeading eyebrow="06 / подход" title="Почему выбирают нас" /><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{values.map(([title, text, Icon]) => <div key={title}><Icon className="size-5 text-primary" aria-hidden="true" /><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16"><SectionHeading eyebrow="07 / вопросы" title="Перед заказом" /><Accordion multiple className="mt-5 grid gap-x-10 md:grid-cols-2">{faqs.map(([question, answer], index) => <AccordionItem key={question} value={String(index)}><AccordionTrigger className="text-left text-sm font-semibold">{question}</AccordionTrigger><AccordionContent className="text-sm leading-6 text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>

      <section className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-14"><div><h2 className="text-3xl font-semibold tracking-tight">Обсудим вашу задачу</h2><p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/85">Поможем выбрать изделия, уточним стоимость и условия поставки.</p></div><Button variant="outline" size="lg" className="border-white/60 bg-transparent text-white hover:bg-white hover:text-primary" asChild><Link href="/custom#request">Получить расчёт <ArrowRight className="size-4" /></Link></Button></div></section>
    </div>
  )
}
