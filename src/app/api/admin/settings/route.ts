import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { authorizeCatalogAdmin } from '@/lib/catalog/admin-api'
import { readSqliteState, writeSqliteState } from '@/lib/database/sqlite-store'
import { defaultSettings, settingsSchema } from '@/lib/content/settings-validation'
import { safeJson } from '@/lib/requests/safe-json'
import { z } from 'zod'
export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store' }
const revision = (raw: string | null) => createHash('sha256').update(raw ?? '').digest('hex')
export async function GET() {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  const state = await readSqliteState('site:settings')
  return NextResponse.json({ settings: state ?? defaultSettings, revision: revision(state ? JSON.stringify(state) : null) }, { headers })
}
export async function PUT(request: Request) {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  const input = await safeJson(request, 64000); if ('error' in input) return input.error
  const outer = z.object({ settings: z.unknown(), revision: z.string() }).safeParse(input.data)
  if (!outer.success) return NextResponse.json({ message: 'Проверьте настройки' }, { status: 400 })
  const body = outer.data
  const parsed = settingsSchema.safeParse(body.settings)
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 })
  const state = await readSqliteState('site:settings')
  const raw = state ? JSON.stringify(state) : null
  if (revision(raw) !== body.revision || !await writeSqliteState('site:settings', parsed.data, raw)) return NextResponse.json({ message: 'Настройки изменились. Обновите страницу.' }, { status: 409 })
  return NextResponse.json({ settings: parsed.data, revision: revision(JSON.stringify(parsed.data)) }, { headers })
}
