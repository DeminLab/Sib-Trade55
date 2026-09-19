import { NextResponse } from "next/server"
import { newsletterSchema } from "@/lib/validators"

export async function POST(request: Request) {
  const parsed = newsletterSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Проверьте email" }, { status: 400 })
  return NextResponse.json({ message: "Подписка будет доступна после подключения backend-сервиса" }, { status: 503 })
}
