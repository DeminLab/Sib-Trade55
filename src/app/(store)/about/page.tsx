import { managedPage } from '@/components/content/managed-page'
import type { Metadata } from "next"
import Link from "next/link"
import Image from "@/components/ui/catalog-image"

import { getSiteSettings } from '@/lib/content/site-settings'

export const metadata: Metadata = {
  title: "О компании",
  description:
    "Продажа и поставка металлоизделий: металлоконструкции, уличная мебель, благоустройство, арт-объекты. СИБ-ТРЕЙД — Омск, работаем по всей России.",
}

export default async function AboutPage() {
  const override = await managedPage('about')
  if (override) return override
  const siteConfig = await getSiteSettings()
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="relative mb-12 min-h-[360px] overflow-hidden bg-neutral-950 sm:min-h-[460px]">
        <Image src="/images/hero-park-composite.webp" alt="Городская среда с металлической мебелью, навесом и велопарковками" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 1440px" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/35 to-neutral-950/10" />
        <div className="relative flex min-h-[360px] max-w-2xl flex-col justify-end p-7 text-white sm:min-h-[460px] sm:p-12">
          <p className="industrial-label text-white/65">СИБ-ТРЕЙД / о компании</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Надёжный поставщик металлоизделий</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl">
      <h2 className="text-3xl font-bold tracking-tight">О компании СИБ-ТРЕЙД</h2>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          СИБ-ТРЕЙД — компания из Омска. Мы продаём и поставляем металлоизделия:
          металлоконструкции, уличную мебель, элементы благоустройства, световое
          оформление и изделия по индивидуальным размерам.
        </p>
        <p>
          Мы работаем как с частными заказчиками, так и со строительными компаниями,
          застройщиками и муниципальными заказчиками.
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Что мы продаём и поставляем
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Металлоконструкции по индивидуальным размерам</li>
          <li>Уличная мебель: скамьи, урны, навесы, велопарковки</li>
          <li>Элементы благоустройства для парков и дворов</li>
          <li>Опоры парковых светильников и световое оформление</li>
          <li>Топиарные фигуры и арт-объекты</li>
          <li>Подбор и поставка по чертежам, фото или техническому заданию</li>
        </ul>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Почему выбирают нас
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Проверенные поставщики и производители</li>
          <li>Работаем дистанционно — поставляем по всей России</li>
          <li>Индивидуальный подход к каждому клиенту</li>
          <li>Прозрачное ценообразование</li>
        </ul>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Контакты
        </h2>
        <p>
          Телефон: {siteConfig.contact.phone}<br />
          Дополнительный телефон: {siteConfig.contact.phoneSecondary}<br />
          Email: {siteConfig.contact.email}<br />
          Город: г. {siteConfig.contact.address.city} · доставляем по всей России
        </p>
        <p>
          <Link href="/custom" className="underline hover:text-foreground">
            Свяжитесь с нами
          </Link>{" "}
          — ответим на любые вопросы.
        </p>
      </div>
      </div>
    </div>
  )
}
