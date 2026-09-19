import type { Metadata } from "next"

export const metadata: Metadata = {
title: "Корзина",
  description: "Просмотр и редактирование корзины.",
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
