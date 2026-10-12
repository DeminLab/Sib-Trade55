import { randomUUID } from "node:crypto"

import { insertSqliteOrder, readSqliteOrders } from "@/lib/database/sqlite-store"
import type { Order } from "@/types"

export async function listOrders(): Promise<Order[]> {
  return readSqliteOrders()
}

export function createOrder(input: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
  const now = new Date().toISOString()
  const date = now.slice(0, 10).replaceAll("-", "")
  const order: Order = {
    ...input,
    id: randomUUID(),
    orderNumber: `ST-${date}-${randomUUID().slice(0, 6).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
  }

  return insertSqliteOrder(order).then(() => order)
}
