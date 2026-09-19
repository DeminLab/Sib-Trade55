import type { Metadata } from "next"
import { QuotePageClient } from "./quote-page-client"

export const metadata: Metadata = {
  title: "Запрос коммерческого предложения — СИБ-ТРЕЙД",
  description: "Соберите список товаров и отправьте запрос коммерческого предложения для вашей компании.",
  alternates: { canonical: "/quote" },
}

export default function QuotePage() {
  return <QuotePageClient />
}
