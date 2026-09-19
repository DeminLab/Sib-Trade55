import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "О компании",
  description:
    "Продажа и поставка металлоконструкций, сантехники и строительных материалов. СИБ-ТРЕЙД — Новосибирск.",
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">О компании СИБ-ТРЕЙД</h1>
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
  )
}
