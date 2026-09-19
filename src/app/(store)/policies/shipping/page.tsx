import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Доставка",
  description: "Условия доставки, стоимость и сроки.",
}

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Доставка</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          Доставка по Новосибирску
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Стандартная доставка (1-3 рабочих дня): 500 ₽</li>
          <li>Бесплатная доставка при заказе от 50 000 ₽</li>
          <li>Срочная доставка (в день заказа): 1 500 ₽</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">
          Доставка по Новосибирской области
        </h2>
        <p>
          Стоимость доставки рассчитывается индивидуально в зависимости от
          расстояния и объёма заказа. Точный расчёт — при оформлении заказа.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Доставка по России
        </h2>
        <p>
          Доставка осуществляется транспортными компаниями. Стоимость и сроки
          зависят от региона. Средние сроки — 5-14 рабочих дней.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Самовывоз
        </h2>
        <p>
          Бесплатно. Пн-пт, 9:00–18:00. Адрес: г. Новосибирск, ул. Промышленная, 15.
          Предварительно согласуйте забор заказа с менеджером.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Обработка заказов
        </h2>
        <p>
          Заказы обрабатываются в течение 1-2 рабочих дней. Заказы, размещённые
          после 16:00 или в выходные, обрабатываются следующий рабочий день.
        </p>
      </div>
    </div>
  )
}
