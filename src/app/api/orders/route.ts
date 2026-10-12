import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

import { adminSessionCookie, isAdminSessionCookie } from "@/lib/auth/session-cookie"
import { createOrder, listOrders } from "@/lib/orders/order-store"
import { readCatalog } from '@/lib/catalog/catalog-store'
import { isPriceOnRequest } from '@/lib/product-presentation'
import { randomUUID } from 'node:crypto'
import { safeJson } from '@/lib/requests/safe-json'

export const runtime = "nodejs"

const orderRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    productId: z.string().min(1),
    variantId: z.string().min(1),
    name: z.string().min(1).max(240),
    variantName: z.string().max(160),
    sku: z.string().max(120),
    image: z.object({ url: z.string().max(2048), alt: z.string().max(240) }),
    price: z.number().finite().nonnegative(),
    quantity: z.number().int().positive().max(10000),
    total: z.number().finite().nonnegative(),
  })).min(1).max(100),
  subtotal: z.number().finite().nonnegative(),
  tax: z.number().finite().nonnegative(),
  shipping: z.number().finite().nonnegative(),
  total: z.number().finite().nonnegative(),
  currency: z.literal("RUB"),
  shippingAddress: z.object({
    id: z.string(),
    type: z.literal("shipping"),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    line1: z.string().min(1).max(300),
    line2: z.string().max(300).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(80),
    phone: z.string().max(40).optional(),
    isDefault: z.boolean(),
  }),
  customerEmail: z.string().email().max(254),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(40).optional(),
})

export async function GET() {
  const cookieStore = await cookies()
  if (!isAdminSessionCookie(cookieStore.get(adminSessionCookie.name)?.value)) {
    return NextResponse.json({ message: "Для просмотра заказов войдите в панель администратора" }, { status: 401 })
  }

  try {
    return NextResponse.json(await listOrders(), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ message: "Не удалось загрузить заявки заказов" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const input = await safeJson(request); if ('error' in input) return input.error
  const parsed = orderRequestSchema.safeParse(input.data)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные заказа" }, { status: 400 })
  }

  try {
    const { products } = await readCatalog()
    const items = []
    for (const line of parsed.data.items) {
      const product = products.find(p => p.id === line.productId && p.status === 'active')
      const variant = product?.variants.find(v => v.id === line.variantId)
      if (!product || !variant) return NextResponse.json({ message: 'Товар изменился или больше не доступен. Обновите корзину.' }, { status: 409 })
      if (isPriceOnRequest(variant)) return NextResponse.json({ message: 'Для товара с ценой по запросу отправьте запрос КП.' }, { status: 409 })
      const requestedQuantity = parsed.data.items.filter(i => i.variantId === variant.id && i.productId === product.id).reduce((sum, i) => sum + i.quantity, 0)
      if (variant.inventory.trackInventory && !variant.inventory.allowBackorder && variant.inventory.quantity < requestedQuantity) return NextResponse.json({ message: 'Недостаточно остатка для выбранного количества.' }, { status: 409 })
      items.push({ ...line, id: randomUUID(), name: product.name, variantName: variant.name, sku: variant.sku, image: variant.images[0] ?? product.images[0] ?? { url: '', alt: product.name }, price: variant.price, total: variant.price * line.quantity })
    }
    const subtotal = items.reduce((sum, line) => sum + line.total, 0)
    const order = await createOrder({
      ...parsed.data,
      items, subtotal, tax: 0, shipping: 0, total: subtotal,
      status: "pending",
      paymentStatus: "pending",
    })
    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json({ message: "Не удалось сохранить заявку. Попробуйте ещё раз" }, { status: 500 })
  }
}
