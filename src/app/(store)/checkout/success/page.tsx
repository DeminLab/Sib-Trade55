"use client"

import { Suspense, useSyncExternalStore } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order_number")
  const savedNumber = useSyncExternalStore(() => () => undefined, () => sessionStorage.getItem('last-order-receipt'), () => null)
  const confirmed = Boolean(orderNumber && savedNumber === orderNumber)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <CheckCircle className="h-16 w-16 text-success" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          {confirmed ? 'Заявка принята' : 'Оформление заявки'}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {orderNumber ? <>Номер заявки: <span className="font-semibold text-foreground">{orderNumber}</span>. </> : null}
          {confirmed ? 'Мы получили ваш запрос и свяжемся с вами для подтверждения заказа и доставки. Оплата не списывалась.' : 'В этом браузере нет подтверждения отправки. Если вы ещё не оформили заявку, перейдите в корзину. Для уточнения уже отправленного заказа свяжитесь с менеджером.'}
        </p>

        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Продолжить покупки</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
