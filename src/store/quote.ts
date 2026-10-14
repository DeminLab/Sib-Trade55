"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, QuoteRequestItem } from "@/types"

interface QuoteState {
  items: QuoteRequestItem[]
  addItem: (item: QuoteRequestItem) => void
  addItems: (items: CartItem[]) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clear: () => void
  getSubtotal: () => number
  getItemCount: () => number
}

function quoteItemFromCart(item: CartItem): QuoteRequestItem {
  return {
    ...item,
    price: 0, lineTotal: 0, priceOnRequest: true,
    currency: "RUB",
  }
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((current) => current.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((current) =>
                current.variantId === item.variantId
                  ? {
                      ...current,
                      quantity: Math.min(10000, current.quantity + item.quantity),
                      price: 0, lineTotal: 0, priceOnRequest: true,
                    }
                  : current
              ),
            }
          }
          return { items: [...state.items, { ...item, price: 0, lineTotal: 0, priceOnRequest: true, quantity: Math.min(10000, item.quantity) }] }
        })
      },

      addItems: (items) => items.forEach((item) => get().addItem(quoteItemFromCart(item))),

      removeItem: (variantId) => set((state) => ({ items: state.items.filter((item) => item.variantId !== variantId) })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((item) => item.variantId === variantId ? { ...item, quantity: Math.min(10000, quantity), price: 0, lineTotal: 0, priceOnRequest: true } : item),
        }))
      },

      clear: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.lineTotal, 0),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "quote-storage" }
  )
)
