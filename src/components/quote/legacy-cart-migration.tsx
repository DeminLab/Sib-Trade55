"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { useQuoteStore } from "@/store/quote"

// Preserve selections from the previous shopping cart, once per browser.
export function LegacyCartMigration() {
  useEffect(() => {
    const cart = useCartStore.getState()
    if (cart.items.length === 0) return
    useQuoteStore.getState().addItems(cart.items)
    cart.clearCart()
    cart.closeCart()
  }, [])
  return null
}
