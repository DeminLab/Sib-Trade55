import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Возврат и обмен",
  description: "Условия возврата и обмена товаров.",
}

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Возврат и обмен
      </h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          Условия возврата
        </h2>
        <p>
          Мы принимаем возврат товара в течение 14 дней с момента получения.
          Товар должен быть в nguyênой упаковке, без следов использования.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Товары, не подлежащие возврату
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Металлоконструкции, изготовленные по индивидуальному заказу</li>
          <li>Товары со следами монтажа или использования</li>
          <li>Товары без оригинальной упаковки</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">
          Как оформить возврат
        </h2>
        <ol className="list-inside list-decimal space-y-2">
          <li>Свяжитесь с нами по телефону или email</li>
          <li>Укажите номер заказа и причину возврата</li>
          <li>Согласуйте способ возврата (самовывоз или доставка)</li>
          <li>Получите возврат средств в течение 5 рабочих дней</li>
        </ol>

        <h2 className="text-xl font-semibold text-foreground">Возврат средств</h2>
        <p>
          Возврат средств осуществляется на тот же счёт, с которого была
          произведена оплата. Срок — до 5 рабочих дней после получения товара.
        </p>
      </div>
    </div>
  )
}
