import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Camera,
  ClipboardList,
  FileText,
  Layers3,
  PencilRuler,
  Ruler,
  Settings2,
  Truck,
} from "lucide-react"

import { CustomRequestForm } from "@/components/custom/custom-request-form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "Подбор и поставка — СИБ-ТРЕЙД",
  description:
    "Подберём и поставим металлоизделие по чертежу, фотографии или техническому заданию. Индивидуальные размеры, серийные партии и нестандартные решения от СИБ-ТРЕЙД.",
  alternates: { canonical: "/custom" },
  openGraph: {
    title: "Подбор и поставка — СИБ-ТРЕЙД",
    description: "Металлоизделия по чертежу, фотографии или ТЗ — от идеи до готового объекта.",
    type: "website",
    url: `${siteConfig.url}/custom`,
    images: [{ url: "/images/products/1768664309964-494604_medium.webp", alt: "Продажа и поставка металлоизделий СИБ-ТРЕЙД" }],
  },
}

const ways = [
  [FileText, "По чертежу", "Подберём товар по проекту, уточним узлы и подготовим точный расчёт."],
  [Camera, "По фотографии", "Разберём референс, восстановим конструкцию и предложим технологичное исполнение."],
  [ClipboardList, "По техническому заданию", "Поможем сформулировать требования, подобрать материал и покрытие."],
  [Ruler, "Индивидуальные размеры", "Адаптируем изделие под объект, нагрузку, габариты и условия эксплуатации."],
  [Layers3, "Серийные партии", "Организуем повторяемые поставки и проверим комплектацию каждой партии."],
  [Settings2, "Нестандартные изделия", "Берём в работу сложные металлоизделия, малые формы и арт-объекты."],
] as const

const process = [
  ["01", "Получение ТЗ", "Изучаем чертёж, фото, размеры и задачу объекта."],
  ["02", "Проработка", "Уточняем конструкцию, материалы, покрытие и узлы."],
  ["03", "Расчёт", "Готовим стоимость, сроки и состав работ."],
  ["04", "Согласование", "Фиксируем решение и оформляем заказ."],
  ["05", "Поставка", "Проверяем комплектацию и состояние товара перед отгрузкой."],
  ["06", "Доставка", "Организуем доставку и при необходимости монтаж на объекте."],
] as const

const faqs = [
  ["Что можно прислать для начала работы?", "Чертёж, фотографию, эскиз от руки или краткое техническое задание с примерными размерами."],
  ["Можно ли заказать только одну единицу?", "Да. Работаем как с единичными изделиями, так и с серийными партиями."],
  ["Поможете выбрать материал и покрытие?", "Да. Подберём решение с учётом нагрузки, улицы или помещения, внешнего вида и бюджета."],
  ["Какие файлы можно приложить?", "PDF, JPG, PNG, DWG и DXF. В форме можно добавить до пяти файлов."],
] as const

export default function CustomPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative min-h-[600px] bg-neutral-950 text-white">
        <Image src="/images/products/1768664309164-708204_medium.webp" alt="Металлоизделия для благоустройства" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-neutral-950/20" />
        <div className="relative mx-auto flex min-h-[600px] max-w-[1440px] flex-col justify-end px-5 pb-14 pt-32 sm:px-8 lg:px-12 lg:pb-20">
          <div className="max-w-3xl"><p className="industrial-label text-white/60">СИБ-ТРЕЙД / поставка под задачу</p><h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-8xl">Подберём и поставим под вашу задачу</h1><p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Металлоизделия по чертежу, фотографии или техническому заданию. От единичного объекта до серийной партии — с расчётом, поставкой и доставкой.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" asChild><a href="#request">Получить расчёт <ArrowRight className="ml-2 size-4" /></a></Button><Button size="lg" variant="outline" asChild className="border-white/45 bg-transparent text-white hover:bg-white hover:text-foreground"><Link href="/shop">Смотреть каталог</Link></Button></div></div>
          <div className="mt-14 grid max-w-4xl border-t border-white/25 pt-5 sm:grid-cols-3"><div className="py-2 text-sm text-white/75 sm:pr-6">Проверенные поставщики</div><div className="border-white/20 py-2 text-sm text-white/75 sm:border-l sm:px-6">Единичные и серийные заказы</div><div className="border-white/20 py-2 text-sm text-white/75 sm:border-l sm:pl-6">Доставка по России</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="max-w-2xl"><p className="industrial-label">01 / формат задачи</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Подбираем товар под вашу задачу</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Необязательно иметь готовый проект. Расскажите, что нужно получить — мы поможем пройти путь от исходных материалов до понятного решения по комплектации и поставке.</p></div><div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{ways.map(([Icon, title, text]) => <div key={title} className="group bg-background p-6 transition-colors hover:bg-surface-subtle"><Icon className="size-6 text-primary transition-transform duration-300 group-hover:-translate-y-1" /><h3 className="mt-12 text-lg font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></section>

      <section className="section-rule bg-surface-subtle"><div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12 lg:py-28"><div className="relative min-h-[520px] overflow-hidden bg-neutral-200"><Image src="/images/products/1768129378765-780527_medium.webp" alt="Металлический навес изнутри" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" /><div className="absolute bottom-5 left-5 bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">От идеи до объекта</div></div><div className="flex flex-col justify-center"><p className="industrial-label">02 / что получаете</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Партнёр по подбору и поставке, а не просто продавец</h2><div className="mt-8 divide-y divide-border">{[["Подбор решения", "Уточняем узлы и предлагаем решение, которое можно подобрать и поставить."], ["Прозрачный расчёт", "Разделяем стоимость материалов, поставки, покрытия и доставки."], ["Контроль комплектации", "Проверяем комплектность и состояние товара перед отгрузкой."]].map(([title, text]) => <div key={title} className="grid grid-cols-[24px_1fr] gap-4 py-5"><span className="mt-1 text-primary">✓</span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></div></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="max-w-2xl"><p className="industrial-label">03 / процесс</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Шесть этапов до готового результата</h2></div><div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{process.map(([number, title, text]) => <div key={number} className="bg-background p-6"><span className="font-mono text-sm text-muted-foreground">{number}</span><h3 className="mt-16 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></section>

      <section id="request" className="section-rule bg-surface-subtle"><div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-12 lg:py-28"><div className="lg:sticky lg:top-28 lg:self-start"><p className="industrial-label">04 / заявка на расчёт</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Расскажите о проекте</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Заполните основные параметры — специалист свяжется с вами, уточнит детали и подготовит расчёт.</p><div className="mt-10 space-y-5 border-t border-border pt-6 text-sm"><div className="flex gap-3"><FileText className="size-5 shrink-0 text-primary" /><span>Прикрепите чертёж, фото, PDF или CAD-файл</span></div><div className="flex gap-3"><Truck className="size-5 shrink-0 text-primary" /><span>Согласуем доставку и монтаж до оформления заказа</span></div><div className="flex gap-3"><Ruler className="size-5 shrink-0 text-primary" /><span>Поможем подобрать размеры, материал и покрытие</span></div><div className="flex gap-3"><PencilRuler className="size-5 shrink-0 text-primary" /><span>Разработка чертежей и дизайна — за дополнительную стоимость по договорённости</span></div></div></div><CustomRequestForm /></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="border-b border-border pb-5"><p className="industrial-label">05 / вопросы</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Частые вопросы по подбору под задачу</h2></div><Accordion multiple={false} className="mt-5 grid gap-x-12 md:grid-cols-2">{faqs.map(([question, answer]) => <AccordionItem key={question} value={question} className="border-b border-border not-last:border-b"><AccordionTrigger className="flex items-center justify-between gap-4 py-5 text-left text-sm font-semibold hover:no-underline">{question}<span className="text-lg font-normal text-muted-foreground transition-transform">+</span></AccordionTrigger><AccordionContent className="pb-5"><p className="text-sm leading-6 text-muted-foreground">{answer}</p></AccordionContent></AccordionItem>)}</Accordion></section>

      <section className="bg-neutral-950 text-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-20"><div><p className="industrial-label text-white/55">06 / следующий шаг</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Есть задача — давайте обсудим</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Если пока нет всех данных, оставьте только контакты и краткое описание проекта.</p></div><Button size="lg" asChild><a href="#request">Получить расчёт <ArrowRight className="ml-2 size-4" /></a></Button></div></section>
    </div>
  )
}
