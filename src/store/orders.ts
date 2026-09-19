"use client"

import { create } from "zustand"
import type { Order } from "@/types"
import { orderService } from "@/lib/services"

interface OrdersState {
  orders: Order[]
  loading: boolean
  error: string | null
  loadOrders: () => Promise<void>
  getOrderById: (id: string) => Order | undefined
}

/** Orders are read from the order API; nothing is persisted in browser storage. */
export const useOrdersStore = create<OrdersState>()((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      set({ orders: await orderService.list(), loading: false })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Не удалось загрузить заказы" })
    }
  },

  getOrderById: (id) => get().orders.find((order) => order.id === id),
}))
