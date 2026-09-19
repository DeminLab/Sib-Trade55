import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия и положения использования сайта и услуг.",
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Условия использования</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Последнее обновление: 1 января 2025 г.
      </p>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          Принятие условий
        </h2>
        <p>
          Используя этот сайт, вы принимаете данные условия. Если вы не согласны
          с какими-либо условиями, пожалуйста, не используйте наш сайт.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Использование сайта
        </h2>
        <p>
          Вы соглашаетесь использовать сайт только в законных целях. Вы несёте
          ответственность за конфиденциальность своих данных для входа.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Товары и цены
        </h2>
        <p>
          Мы стараемся отображать точную информацию о товарах и ценах. Однако
          возможны ошибки. Мы оставляем за собой право исправлять ошибки и
          отменять заказы, размещённые по ошибочным ценам.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Интеллектуальная собственность
        </h2>
        <p>
          Все материалы на сайте, включая тексты, изображения и логотипы,
          защищены законодательством об интеллектуальной собственности.
        </p>

        <h2 className="text-xl font-semibold text-foreground">
          Ограничение ответственности
        </h2>
        <p>
          Компания не несёт ответственности за косвенные, случайные или
          сопутствующие убытки, возникшие в результате использования сайта.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Контакты</h2>
        <p>
          По вопросам использования сайта обращайтесь: info@sib-trade.ru
        </p>
      </div>
    </div>
  )
}
