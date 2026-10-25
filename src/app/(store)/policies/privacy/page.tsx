import { managedPage } from '@/components/content/managed-page'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Как мы собираем, используем и защищаем ваши персональные данные.",
}

export default async function PrivacyPolicyPage() {
  const override = await managedPage('policies-privacy')
  if (override) return <>{override}<VisitorAnalyticsDisclosure /></>
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Политика конфиденциальности</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Последнее обновление: 25 октября 2026 г.
      </p>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">
          Какие данные мы собираем
        </h2>
        <p>
          Мы собираем данные, которые вы предоставляете напрямую: имя, email,
          адрес доставки и информацию об оплате при оформлении заказа. Также мы
          автоматически собираем информацию об устройстве и активности на сайте.
        </p>

        <VisitorAnalyticsDisclosure />

        <h2 className="text-xl font-semibold text-foreground">
          Как мы используем ваши данные
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Для обработки и выполнения ваших заказов</li>
          <li>Для связи с вами по поводу заказов</li>
          <li>Для отправки информационных рассылок (с вашего согласия)</li>
          <li>Для улучшения работы сайта</li>
          <li>Для предотвращения мошенничества</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">
          Защита данных
        </h2>
        <p>
          Мы используем стандартные отраслевые методы защиты персональных данных.
          Данные об оплате обрабатываются безопасно и не хранятся на наших серверах.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Ваши права</h2>
        <p>
          Вы имеете право на доступ, изменение или удаление ваших персональных
          данных в любое время. Свяжитесь с нами по адресу sib-trade55@yandex.ru.
        </p>
      </div>
    </div>
  )
}

function VisitorAnalyticsDisclosure() {
  return (
    <section className="mt-8 space-y-3 text-muted-foreground">
      <h2 className="text-xl font-semibold text-foreground">Аналитика посещений</h2>
      <p>
        Для подсчёта посещений витрина использует first-party cookie со случайным
        идентификатором браузера сроком на один год. Записываются просмотренные
        страницы, время, тип устройства, браузер, операционная система и источник
        перехода (домен и путь без параметров ссылки). Если покупатель авторизован,
        к визитам привязываются ID и email из его учётной записи. IP-адреса и точная
        геолокация не сохраняются. Анонимного посетителя можно отличить только по
        случайному идентификатору браузера. Записи журнала сейчас не удаляются
        автоматически. Вопросы можно направить на sib-trade55@yandex.ru.
      </p>
    </section>
  )
}
