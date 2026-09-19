import { NextResponse } from "next/server"

export async function DELETE() {
  return NextResponse.json({ message: "Адреса будут изменяться backend-сервисом после его подключения" }, { status: 503 })
}
