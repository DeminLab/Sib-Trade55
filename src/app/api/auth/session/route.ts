import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminSessionCookie, readSessionCookie } from '@/lib/auth/session-cookie'
export async function GET() {
  const session = readSessionCookie((await cookies()).get(adminSessionCookie.name)?.value)
  const now = new Date().toISOString()
  const user = session && typeof session.id === 'string' && typeof session.email === 'string' ? { id: session.id, email: session.email, role: session.role, firstName: session.firstName ?? 'Пользователь', lastName: session.lastName ?? '', addresses: [], createdAt: now, updatedAt: now } : null
  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'private, no-store' } })
}
