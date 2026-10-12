import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/validators"
import { isDemoAuthEnabled, registerDemoUser } from "@/lib/auth/demo-auth"
import { adminSessionCookie, createSessionCookieValue } from "@/lib/auth/session-cookie"

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные" }, { status: 400 })
  const session = registerDemoUser(parsed.data)
  if (session) {
    const response = NextResponse.json(session, { status: 201 })
    const value = createSessionCookieValue(session.user)
    if (value) response.cookies.set(adminSessionCookie.name, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: adminSessionCookie.maxAge })
    return response
  }
  if (!isDemoAuthEnabled()) return NextResponse.json({ message: "Регистрация будет доступна после подключения backend-сервиса" }, { status: 503 })
  return NextResponse.json({ message: "Не удалось создать аккаунт" }, { status: 500 })
}
