import type { Metadata } from "next"

export const metadata: Metadata = {
title: "Избранное",
  description: "Сохранённые товары.",
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
