import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeCatalogAdmin } from '@/lib/catalog/admin-api'
import { updateSqliteOrder } from '@/lib/database/sqlite-store'
export const runtime = 'nodejs'
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  const parsed = z.object({ status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'Проверьте статус' }, { status: 400 })
  const order = await updateSqliteOrder((await ctx.params).id, parsed.data.status)
  return NextResponse.json(order ?? { message: 'Заказ не найден' }, { status: order ? 200 : 404, headers: { 'Cache-Control': 'private, no-store' } })
}
