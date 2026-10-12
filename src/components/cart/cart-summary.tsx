"use client"

import { formatPrice } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface CartSummaryProps {
  subtotal: number
}

export function CartSummary({ subtotal }: CartSummaryProps) {

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Подытог</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Доставка</span>
        <span>Согласуем с менеджером</span>
      </div>
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Предварительная сумма товаров</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Стоимость и условия поставки уточним при обработке заявки. Онлайн-оплата не требуется.</p>
    </div>
  )
}
