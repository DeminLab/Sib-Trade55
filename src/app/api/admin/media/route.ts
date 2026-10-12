import { NextResponse } from 'next/server'
import { authorizeCatalogAdmin } from '@/lib/catalog/admin-api'
import { saveCatalogImage } from '@/lib/catalog/media-store'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const denied = await authorizeCatalogAdmin(); if (denied) return denied
  if (Number(request.headers.get('content-length')) > 11 * 1024 * 1024) return NextResponse.json({ message: 'Максимум 10 МБ' }, { status: 413 })
  try {
    const file = (await request.formData()).get('image')
    if (!(file instanceof File) || file.size > 10 * 1024 * 1024) return NextResponse.json({ message: 'Выберите изображение до 10 МБ' }, { status: 400 })
    return NextResponse.json(await saveCatalogImage(file, file.name), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return NextResponse.json({ message: 'Не удалось загрузить изображение. Используйте JPG, PNG или WebP.' }, { status: 400 }) }
}
