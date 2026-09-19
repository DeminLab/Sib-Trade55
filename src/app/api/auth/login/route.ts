import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/validators"
import { authenticateDemoUser, isDemoAuthEnabled } from "@/lib/auth/demo-auth"

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте данные" }, { status: 400 })
  const session = authenticateDemoUser(parsed.data.email, parsed.data.password)
  if (session) return NextResponse.json(session)
  if (isDemoAuthEnabled()) return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 })
  return NextResponse.json({ message: "Авторизация будет доступна после подключения backend-сервиса" }, { status: 503 })
}
