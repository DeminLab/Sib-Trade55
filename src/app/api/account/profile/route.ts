import { NextResponse } from "next/server"

export async function PUT() {
  return NextResponse.json({ message: "Профиль будет сохраняться backend-сервисом после его подключения" }, { status: 503 })
}
