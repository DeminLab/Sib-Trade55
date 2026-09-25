import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  Factory,
  FileText,
  Layers3,
  Ruler,
  ShieldCheck,
  Truck,
  Upload,
} from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/products/product-grid"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { siteConfig } from "@/lib/config"
import { categoryRepository, productRepository } from "@/lib/repositories"
import type { Category } from "@/types"

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

const directionBlueprint = [
  { slug: "figury-iz-metalla", title: "Арт-объекты", text: "Скульптуры, инсталляции и малые формы" },
  { slug: "ulichnaya-mebel", title: "Уличная мебель", text: "Скамьи, урны, навесы и велопарковки" },
  { slug: "zhkh-i-blagoustroystvo", title: "Благоустройство", text: "Элементы для парков, дворов и общественных пространств" },
  { slug: "metallokonstruktsii", title: "Металлоконструкции", text: "Каркасы, лестницы, ограждения и навесы" },
  { slug: "svetovoe-oformlenie", title: "Световое оформление", text: "Опоры, светильники и декоративные решения" },
  { slug: "custom", title: "Подбор по ТЗ", text: "Подбираем решения под нестандартные технические задачи" },
]

// Изображения для направлений: фото/рендеры изделий, где у категории
// нет собственного изображения — только реальные фото с производства.
const directionImages: Record<string, { url: string; alt: string }> = {
  custom: { url: "/images/products/park-bench-photo-01.webp", alt: "Скамья с металлическим каркасом, изготовленная по заказу" },
}

const processSteps = [
  ["01", "Заявка", "Вы оставляете запрос или техническое задание"],
  ["02", "Обсуждение", "Уточняем детали, материалы и ограничения"],
  ["03", "Расчёт", "Согласуем стоимость, сроки и состав работ"],
  ["04", "Поставка", "Проверяем комплектацию товара перед отгрузкой"],
  ["05", "Доставка", "Привозим на объект и помогаем с монтажом"],
] as const

const materials = [
  ["Черная сталь", "Прочная основа для конструкций", "/images/products/1767891212226-566564_medium.webp"],
  ["Нержавеющая сталь", "Для долговечных и декоративных решений", "/images/products/1767891133482-513300_medium.webp"],
  ["Алюминий", "Лёгкость и коррозионная стойкость", "/images/products/1767891298425-968037_medium.webp"],
  ["Оцинкованная сталь", "Защита в сложных условиях", "/images/products/1767892372211-18503_medium.webp"],
  ["Порошковая окраска", "Широкая палитра и стойкое покрытие", "/images/products/1767892372252-669767_medium.webp"],
  ["Патинирование", "Декоративный эффект для арт-объектов", "/images/products/1767892372296-327630_medium.webp"],
] as const

const values = [
  ["Комплексный подход", "От разработки до монтажа", Ruler],
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

// Панели главного экрана: контейнерные площадки, опоры светильников, велопарковки
const heroPanels = [
  { src: "/images/products/1768129390228-823380_medium.webp", alt: "Контейнерная площадка с навесом из металла" },
  { src: "/images/products/1768129469674-398494_medium.webp", alt: "Опора паркового светильника" },
  { src: "/images/products/veloparkovka-01.svg", alt: "Велопарковка с металлическими стойками" },
] as const

function imageFor(category?: Category) {
  return category?.image?.url ?? PLACEHOLDER_IMAGE
}

function SectionHeading({
  eyebrow,
  title,
  text,
  href,
  linkLabel,
}: {
  eyebrow: string
  title: string
  text?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="industrial-label">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">{title}</h2>
        {text ? <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{text}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground" href={href}>
          {linkLabel}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      ) : null}
    </div>
  )
}

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    categoryRepository.list(),
    productRepository.getFeatured(5),
  ])

  const topLevelCategories = categories.filter((category) => !category.parentId)
  const categoryBySlug = new Map(topLevelCategories.map((category) => [category.slug, category]))
  const directions = directionBlueprint.map((direction) => ({
    ...direction,
    category: categoryBySlug.get(direction.slug),
  }))

  return (
    <div className="flex flex-col overflow-hidden bg-background">
      <section className="relative border-b border-white/15 bg-neutral-950 text-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 pb-12 pt-12 sm:px-8 lg:min-h-[680px] lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:px-12 lg:pb-16 lg:pt-24">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-white/65">СИБ-ТРЕЙД / продажа и поставка</p>
            <h1 className="text-4xl font-semibold leading-[0.97] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Продаём и поставляем металлоизделия на заказ</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/75 sm:text-lg">Подбираем и поставляем конструкции, мебель, арт-объекты и решения для городской среды — от задачи до готового объекта.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><Link href="/contact">Получить расчёт <ArrowRight className="ml-2 size-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild className="border-white/45 bg-transparent text-white hover:bg-white hover:text-foreground"><Link href="/shop">Смотреть каталог</Link></Button>
            </div>
            <div className="mt-12 grid max-w-3xl border-t border-white/25 pt-5 sm:grid-cols-3">
              {["Проверенные поставщики", "Работаем по чертежам и ТЗ", "Доставка по России"].map((item) => <div key={item} className="border-white/20 py-3 text-sm font-medium text-white/85 sm:border-r sm:px-5 sm:first:pl-0 last:border-0">{item}</div>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {heroPanels.map((panel, index) => (
              <div key={panel.src} className={`relative overflow-hidden bg-neutral-900 ${index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}>
                <Image src={panel.src} alt={panel.alt} fill priority={index === 0} className="object-cover" sizes={index === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="01 / направления" title="Делаем среду, которой хочется пользоваться" text="Создаём функциональные и эстетичные решения из металла для города, бизнеса и частных проектов." href="/shop" linkLabel="Все направления" />
        <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {directions.map(({ slug, title, text, category }) => {
            const image = directionImages[slug] ?? category?.image
            return (
              <Link key={title} href={category ? `/${category.slug}` : "/contact"} className="group relative min-h-[300px] overflow-hidden bg-background p-6">
                <Image src={image?.url ?? PLACEHOLDER_IMAGE} alt={image?.alt ?? title} fill className="object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-100" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/15 to-transparent" />
                <div className="relative flex h-full min-h-[248px] flex-col justify-end text-white"><div className="flex items-end justify-between gap-4"><div><h3 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-white/70">{text}</p></div><ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div></div>
              </Link>
            )
          })}
        </div>
      </section>

      <section id="brief" className="section-rule bg-surface-subtle">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="industrial-label">02 / подбор под задачу</p><h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Подберём и поставим по вашему техническому заданию</h2><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Работаем по чертежам, эскизам, фото или идее. Поможем с разработкой, подскажем оптимальные материалы и технологию.</p><Link href="/contact" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">Обсудить проект <ArrowRight className="size-4" /></Link><p className="mt-6 max-w-lg border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">Разработка чертежей и дизайна — за дополнительную стоимость, по договорённости.</p></div><div className="grid border border-border sm:grid-cols-2 lg:grid-cols-4">{[[FileText, "Чертёж", "PDF, DWG, JPG"], [Camera, "Фото или эскиз", "Любой формат"], [Ruler, "Описание", "Размеры, материалы, задачи"], [Upload, "Прикрепить файл", "До 20 МБ"]].map(([Icon, title, text]) => <div key={title as string} className="border-b border-border p-5 last:border-0 sm:border-r sm:nth-[2n]:border-r-0 lg:border-b-0 lg:nth-[2n]:border-r lg:last:border-r-0"><Icon className="size-5 text-primary" /><p className="mt-8 font-semibold">{title as string}</p><p className="mt-1 text-xs text-muted-foreground">{text as string}</p>{title === "Прикрепить файл" ? <label className="mt-5 inline-flex cursor-pointer text-xs font-semibold text-primary hover:underline"><input type="file" className="sr-only" />Выбрать файл</label> : null}</div>)}</div></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><SectionHeading eyebrow="03 / готовые изделия" title="Популярные изделия" text="Проверенные решения, которые можно заказать из каталога или адаптировать под ваш проект." href="/shop" linkLabel="Смотреть каталог" /><div className="mt-10"><ProductGrid products={featuredProducts} /></div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><SectionHeading eyebrow="04 / реализованные проекты" title="Проекты, которые работают в реальной среде" text="От городской мебели до металлоконструкций из каталога — показываем результат, а не только эскизы." href="/cases" linkLabel="Все проекты" /><div className="mt-10 grid gap-4 md:grid-cols-12">{[["Городское благоустройство", directions[2]?.category, "md:col-span-7 md:row-span-2"], ["Арт-объект", directions[0]?.category, "md:col-span-5"], ["Металлоконструкции", directions[3]?.category, "md:col-span-5"]].map(([title, category, span]) => <Link key={title as string} href={category ? `/${(category as Category).slug}` : "/contact"} className={`group relative min-h-[260px] overflow-hidden bg-neutral-900 ${span}`}><Image src={imageFor(category as Category | undefined)} alt={title as string} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white"><h3 className="text-xl font-semibold">{title as string}</h3><ArrowUpRight className="size-5" /></div></Link>)}</div></div></section>

      <section className="bg-neutral-950 text-white"><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><SectionHeading eyebrow="05 / процесс" title="Как мы работаем" text="Прозрачный путь от первого разговора до готового изделия." /><div className="mt-10 grid gap-px border border-white/15 bg-white/15 md:grid-cols-5">{processSteps.map(([number, title, text]) => <div key={number} className="bg-neutral-950 p-6"><span className="font-mono text-sm text-white/45">{number}</span><h3 className="mt-16 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{text}</p></div>)}</div></div></section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><SectionHeading eyebrow="06 / материалы" title="Материалы и покрытия" text="Подбираем фактуру и защиту поверхности под условия эксплуатации и характер проекта." /><div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">{materials.map(([title, text, image]) => <div key={title}><div className="relative aspect-[1.25] overflow-hidden bg-neutral-200"><Image src={image} alt={title} fill className="object-cover grayscale transition duration-500 hover:grayscale-0" sizes="(max-width: 768px) 50vw, 16vw" /></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div>)}</div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><SectionHeading eyebrow="07 / сиб-трейд" title="Почему выбирают нас" text="Собираем в одной команде продажу и поставку, инженерную экспертизу и ответственную работу с объектом." /><div className="mt-10 grid border-y border-border md:grid-cols-5">{values.map(([title, text, Icon]) => <div key={title} className="border-b border-border p-6 last:border-0 md:border-b-0 md:border-r md:last:border-r-0"><Icon className="size-6 text-primary" /><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-12 lg:py-28"><div><SectionHeading eyebrow="08 / логистика" title="Доставка и гарантия" text="Берём на себя организацию логистики и помогаем пройти путь от склада до объекта без лишних рисков." /></div><div className="grid gap-4 sm:grid-cols-2"><div className="border-l-2 border-primary pl-5"><Truck className="size-5 text-primary" /><h3 className="mt-5 font-semibold">Доставка</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Рассчитаем стоимость доставки и согласуем удобное окно.</p></div><div className="border-l-2 border-primary pl-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-5 font-semibold">Гарантия</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Фиксируем гарантийные условия в документах к заказу.</p></div></div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><SectionHeading eyebrow="09 / вопросы" title="Часто задаваемые вопросы" /><Accordion multiple={false} className="mt-10 grid gap-x-12 md:grid-cols-2">{faqs.map(([question, answer]) => <AccordionItem key={question} value={question} className="border-b border-border not-last:border-b"><AccordionTrigger className="flex items-center justify-between gap-4 py-5 text-left text-sm font-semibold hover:no-underline">{question}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" /></AccordionTrigger><AccordionContent className="pb-5"><p className="max-w-xl text-sm leading-6 text-muted-foreground">{answer}</p></AccordionContent></AccordionItem>)}</Accordion></div></section>

      <section className="relative overflow-hidden bg-neutral-900 text-white"><Image src="/images/products/1768664309964-494604_medium.webp" alt="" fill className="object-cover opacity-35" sizes="100vw" /><div className="absolute inset-0 bg-neutral-950/50" /><div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-24"><div><p className="industrial-label text-white/55">10 / следующий проект</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Рассчитаем ваш проект</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/65">Оставьте заявку — свяжемся с вами, уточним детали и подготовим инженерное решение.</p></div><Button size="lg" asChild><Link href="/contact">Получить расчёт <ArrowRight className="ml-2 size-4" /></Link></Button></div></section>
    </div>
  )
}
