import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ message: "Сессия будет завершаться backend-сервисом после его подключения" }, { status: 503 })
}
