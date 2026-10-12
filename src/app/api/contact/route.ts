import { NextResponse } from "next/server"

import { contactRequestSchema } from "@/lib/requests/validation"
import { createCustomerRequest } from "@/lib/requests/request-store"
import { readRequestJson, RequestBodyTooLargeError } from "@/lib/requests/request-body"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const payload = await readRequestJson(request)
    const parsed = contactRequestSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Проверьте данные формы" },
        { status: 400 }
      )
    }

    const response = await createCustomerRequest({ kind: "contact", data: parsed.data })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ message: "Обращение слишком большое" }, { status: 413 })
    return NextResponse.json(
      { success: false, message: "Не удалось обработать обращение" },
      { status: 500 }
    )
  }
}
