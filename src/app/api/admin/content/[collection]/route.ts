import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { authorizeCatalogAdmin } from '@/lib/catalog/admin-api'
import { readSqliteState, writeSqliteState } from '@/lib/database/sqlite-store'
import { contentModels, type ContentCollection } from '@/lib/content-models'
import { contentSchemas } from '@/lib/content/content-validation'
import { safeJson } from '@/lib/requests/safe-json'
import { z } from 'zod'

export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store' }
const revision = (payload: string | null) => createHash('sha256').update(payload ?? '').digest('hex')
async function source(collection: string) {
  if (!Object.hasOwn(contentModels, collection)) return null
  const model = contentModels[collection as ContentCollection]
  const key = `content:${model.key}`
  const data = await readSqliteState<Record<string, Record<string, unknown>[]>>(key) ?? {}
  const payload = JSON.stringify(data)
  return { model, key, data, payload, revision: revision(payload) }
}
export async function GET(_request: Request, ctx: { params: Promise<{ collection: string }> }) {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  const state = await source((await ctx.params).collection)
  if (!state) return NextResponse.json({ message: 'Раздел не найден' }, { status: 404 })
  return NextResponse.json({ items: state.data[state.model.list] ?? [], revision: state.revision }, { headers })
}
export async function POST(request: Request, ctx: { params: Promise<{ collection: string }> }) {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  const collection = (await ctx.params).collection
  const input = await safeJson(request); if ('error' in input) return input.error
  const parsedBody = z.object({ action: z.enum(['save', 'archive', 'restore']), revision: z.string().length(64), id: z.string().max(160).optional(), item: z.unknown().optional() }).safeParse(input.data)
  if (!parsedBody.success) return NextResponse.json({ message: 'Проверьте действие и версию документа' }, { status: 400 })
  const body = parsedBody.data
  try {
    const state = await source(collection)
    if (!state) return NextResponse.json({ message: 'Раздел не найден' }, { status: 404 })
    if (state.revision !== body.revision) return NextResponse.json({ message: 'Контент изменился в другой вкладке. Обновите список перед сохранением.' }, { status: 409 })
    const items = state.data[state.model.list] ?? []
    const idField = collection === 'ralColors' ? 'code' : 'id'
    if (body.action === 'save') {
      const parsed = contentSchemas[collection as ContentCollection].safeParse(body.item)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 })
      const item = parsed.data as Record<string, unknown>
      if (!item[idField]) item[idField] = randomUUID()
      const index = items.findIndex(i => i[idField] === (collection === 'ralColors' ? body.id ?? item.code : item.id))
      if (items.some((i, n) => n !== index && (item.slug ? i.slug === item.slug : i.code === item.code))) return NextResponse.json({ message: 'Этот адрес или код уже занят' }, { status: 409 })
      const updated = { ...(index >= 0 ? items[index] : {}), ...item, updatedAt: new Date().toISOString() }
      if (index >= 0) items[index] = updated; else items.push(updated)
    } else {
      const item = items.find(i => i[idField] === body.id)
      if (!item) return NextResponse.json({ message: 'Запись не найдена' }, { status: 404 })
      item.archived = body.action === 'archive'
      item.updatedAt = new Date().toISOString()
    }
    state.data[state.model.list] = items
    if (!await writeSqliteState(state.key, state.data, state.payload)) return NextResponse.json({ message: 'Контент изменился. Обновите список.' }, { status: 409 })
    return NextResponse.json({ items, revision: revision(JSON.stringify(state.data)) }, { headers })
  } catch { return NextResponse.json({ message: 'Не удалось сохранить контент' }, { status: 500 }) }
}
