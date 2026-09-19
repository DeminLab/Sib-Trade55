import { NextResponse } from "next/server"

import { contactFormSchema } from "@/lib/validators"
import { contactRepository, ServiceNotConfiguredError } from "@/lib/services"
import type { ContactResponse } from "@/types"

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json()
    const parsed = contactFormSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Проверьте данные формы" },
        { status: 400 }
      )
    }

    const response: ContactResponse = await contactRepository.create(parsed.data)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ServiceNotConfiguredError) {
      return NextResponse.json({ success: false, message: "Приём обращений будет доступен после подключения backend-сервиса" }, { status: 503 })
    }
    return NextResponse.json(
      { success: false, message: "Не удалось обработать обращение" },
      { status: 500 }
    )
  }
}
