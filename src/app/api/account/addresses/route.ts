import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ message: "Адреса будут сохраняться backend-сервисом после его подключения" }, { status: 503 })
}
