import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "О компании",
  description:
    "Продажа и поставка металлоконструкций, сантехники и строительных материалов. СИБ-ТРЕЙД — Новосибирск.",
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="relative mb-12 min-h-[360px] overflow-hidden bg-neutral-950 sm:min-h-[460px]">
        <Image src="/images/generated/supplier-yard.png" alt="Склад и зона комплектации СИБ-ТРЕЙД" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 1440px" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/35 to-transparent" />
        <div className="relative flex min-h-[360px] max-w-2xl flex-col justify-end p-7 text-white sm:min-h-[460px] sm:p-12">
          <p className="industrial-label text-white/65">СИБ-ТРЕЙД / о компании</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Надёжный поставщик для стройки и дома</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl">
      <h2 className="text-3xl font-bold tracking-tight">О компании СИБ-ТРЕЙД</h2>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          СИБ-ТРЕЙД — это компания, которая начала работу с небольшого торгового направления
          в Новосибирске и выросла в надёжного поставщика металлоконструкций,
          сантехники и строительных материалов.
        </p>
        <p>
          Мы работаем как с частными заказчиками, так и с строительными компаниями.
          Наша цель —提供优质ные товары и услуги по честным ценам.
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Что мы предлагаем
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Комплектация металлоконструкций по индивидуальным размерам</li>
          <li>Широкий ассортимент сантехники от ведущих производителей</li>
          <li>Строительные материалы оптом и в розницу</li>
          <li>Профессиональный инструмент</li>
          <li>Доставка по Новосибирску и Новосибирской области</li>
          <li>Гарантия на все товары и работы</li>
        </ul>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Почему выбирают нас
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Проверенные поставщики металлоконструкций</li>
          <li>Работаем с 2015 года</li>
          <li>Более 5 000 выполненных заказов</li>
          <li>Индивидуальный подход к каждому клиенту</li>
          <li>Прозрачное ценообразование</li>
        </ul>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Контакты
        </h2>
        <p>
          Телефон: +7 (383) 123-45-67<br />
          Email: info@sib-trade.ru<br />
          Адрес: г. Новосибирск, ул. Промышленная, 15
        </p>
        <p>
          <Link href="/contact" className="underline hover:text-foreground">
            Свяжитесь с нами
          </Link>{" "}
          — ответим на любые вопросы.
        </p>
      </div>
      </div>
    </div>
  )
}
