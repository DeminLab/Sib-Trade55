import { managedPage } from '@/components/content/managed-page'
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Camera, Clock3, FileDown, FileText, Ruler, Send, ShieldCheck, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Как мы работаем — СИБ-ТРЕЙД",
  description: "Понятный процесс СИБ-ТРЕЙД: от отправки задачи и расчёта до оформления заказа и доставки металлоизделия.",
  alternates: { canonical: `${siteConfig.url}/how-we-work` },
  openGraph: {
    title: "Как мы работаем — СИБ-ТРЕЙД",
    description: "От задачи до готового металлоизделия: шесть этапов работы СИБ-ТРЕЙД.",
    type: "website",
    url: `${siteConfig.url}/how-we-work`,
    images: [{ url: "/api/catalog/media/images/products/1768664309964-494604_medium.webp", alt: "Продажа и поставка металлоизделий СИБ-ТРЕЙД" }],
  },
}

const steps = [
  ["01", "Отправьте задачу", "Опишите, что нужно подобрать и поставить, и приложите всё, что уже есть: чертёж, фото, эскиз или ТЗ."],
  ["02", "Изучаем ТЗ", "Проверяем размеры, нагрузку, материал, покрытие, комплектность и условия эксплуатации."],
  ["03", "Рассчитываем стоимость", "Формируем состав работ, материалы, покрытие, сроки и ориентировочную логистику."],
  ["04", "Согласовываем", "Уточняем решение, фиксируем спецификацию и утверждаем финальные параметры заказа."],
  ["05", "Оформляем заказ", "Подбираем товар по согласованным параметрам, проверяем комплектацию и организуем поставку."],
  ["06", "Доставляем", "Комплектуем заказ, организуем доставку и при необходимости помогаем с монтажом."],
] as const

const inputItems = [
  [FileText, "Чертёж или эскиз", "Даже черновой схемы достаточно, чтобы начать техническую оценку."],
  [Ruler, "Размеры и количество", "Укажите габариты, предполагаемую нагрузку и количество изделий."],
  [Camera, "Фотография или референс", "Покажите пример, место установки или существующую конструкцию."],
  [Send, "Параметры заказа", "Опишите назначение, среду эксплуатации, цвет и требования к сроку."],
] as const

const fileTypes = ["PDF", "JPG", "PNG", "DWG", "DXF"]

export default async function HowWeWorkPage() {
  const override = await managedPage('how-we-work')
  if (override) return override
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative min-h-[560px] bg-neutral-950 text-white">
        <Image src="/images/hero-park-composite.png" alt="Городской парк с металлической мебелью и навесом" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/65 to-neutral-950/20" />
        <div className="relative mx-auto flex min-h-[560px] max-w-[1440px] flex-col justify-end px-5 pb-16 pt-32 sm:px-8 lg:px-12 lg:pb-20">
          <div className="max-w-4xl"><p className="industrial-label text-white/60">СИБ-ТРЕЙД / процесс работы</p><h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">От задачи до готового объекта</h1><p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Понятный торговый процесс без лишних этапов: фиксируем задачу, предлагаем решение, согласовываем расчёт и доводим заказ до доставки.</p><Button size="lg" className="mt-8" asChild><Link href="#request">Получить расчёт <ArrowRight className="ml-2 size-4" /></Link></Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="max-w-3xl"><p className="industrial-label">01 / шесть этапов</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Каждый следующий шаг понятен заранее</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Вы понимаете, на каком этапе находится проект, какие данные нужны от вас и когда появляется зафиксированная стоимость.</p></div><div className="relative mt-14"><div className="absolute left-5 top-0 hidden h-full w-px bg-border lg:left-1/12 lg:block" /><ol className="grid gap-0 lg:grid-cols-6">{steps.map(([number, title, text], index) => <li key={number} className="relative border-b border-border py-7 first:border-t lg:border-b-0 lg:border-l lg:border-border lg:px-6 lg:py-0 lg:first:border-l-0 lg:first:pl-0"><div className="flex gap-5 lg:block"><span className="relative z-10 flex size-10 shrink-0 items-center justify-center border border-primary bg-background font-mono text-xs font-semibold text-primary lg:mb-10">{number}</span><div><h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div></div>{index < steps.length - 1 ? <ArrowRight className="absolute -right-3 top-0 hidden size-5 bg-background p-0.5 text-primary lg:block" /> : null}</li>)}</ol></div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-12 lg:py-28"><div><p className="industrial-label">02 / исходные данные</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Что можно отправить</h2><p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">Не ждём идеального пакета документов. Начните с того, что есть — инженер задаст уточняющие вопросы после первичного просмотра.</p></div><div className="grid gap-px border border-border bg-border sm:grid-cols-2">{inputItems.map(([Icon, title, text]) => <div key={title} className="bg-background p-6 transition-colors hover:bg-accent/30"><Icon className="size-6 text-primary" /><h3 className="mt-10 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-28"><div><p className="industrial-label">03 / формат заявки</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Сколько информации желательно предоставить</h2><div className="mt-8 divide-y divide-border border-y border-border">{[["Минимум", "Что подобрать и поставить, примерные размеры, количество и ваши контакты."], ["Хорошая заявка", "Фото или эскиз, материал, покрытие, место установки и желаемый срок."], ["Полное ТЗ", "Рабочие чертежи, допуски, требования к узлам, упаковке, доставке и монтажу."]].map(([title, text]) => <div key={title} className="grid gap-3 py-5 sm:grid-cols-[140px_1fr] sm:gap-6"><span className="font-semibold">{title}</span><span className="text-sm leading-6 text-muted-foreground">{text}</span></div>)}</div></div><div className="border border-border bg-surface-subtle p-7 sm:p-10"><FileDown className="size-7 text-primary" /><h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">Какие файлы принимаем</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Прикрепите до пяти файлов, если они помогают понять форму, размеры или условия поставки.</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">{fileTypes.map((type) => <div key={type} className="border border-border bg-background px-3 py-4 text-center font-mono text-xs font-semibold">.{type.toLowerCase()}</div>)}</div><p className="mt-6 text-xs leading-5 text-muted-foreground">Если чертежа нет, отправьте фотографию или краткое описание — мы поможем сформировать исходные требования.</p></div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="grid gap-px border border-border bg-border md:grid-cols-3"><div className="bg-background p-7"><Clock3 className="size-6 text-primary" /><h3 className="mt-10 text-xl font-semibold">Когда появляется точная стоимость</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">Ориентир даём после первичного изучения задачи. Финальная стоимость появляется после согласования размеров, материала, покрытия, комплектности и логистики.</p></div><div className="bg-background p-7"><ShieldCheck className="size-6 text-primary" /><h3 className="mt-10 text-xl font-semibold">Что влияет на срок</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">Сложность конструкции, объём партии, наличие материалов, технология покрытия, согласования и готовность площадки к монтажу.</p></div><div className="bg-background p-7"><Truck className="size-6 text-primary" /><h3 className="mt-10 text-xl font-semibold">Что входит в финал</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">Фиксируем состав изделия, этапы, срок поставки, условия доставки и дополнительные работы в одном согласованном предложении.</p></div></div></div></section>

      <section id="request" className="relative isolate overflow-hidden bg-neutral-950 text-white"><Image src="/images/hero-park-composite.png" alt="" fill className="object-cover" sizes="100vw" /><div className="absolute inset-0 bg-neutral-950/70" /><div className="relative mx-auto flex min-h-[300px] max-w-[1440px] flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-20"><div><p className="industrial-label text-white/70">04 / следующий шаг</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Есть задача — начнём с расчёта</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">Отправьте исходные материалы или просто опишите идею. Вернёмся с уточнениями, ориентиром по стоимости и сроком.</p></div><Button size="lg" asChild><Link href="/custom">Получить расчёт <ArrowRight className="ml-2 size-4" /></Link></Button></div></section>
    </div>
  )
}
