import { randomUUID } from "node:crypto"
import { getSqliteRequest, insertSqliteRequest, updateSqliteRequest } from "@/lib/database/sqlite-store"
import type { RequestRecord, RequestReceipt } from "./types"

type RequestInput = RequestRecord extends infer R ? R extends RequestRecord ? Pick<R, "kind" | "data"> : never : never

export async function createCustomerRequest(input: RequestInput, files: File[] = []): Promise<RequestReceipt> {
  const now = new Date().toISOString()
  const attachments = await Promise.all(files.map(async (file) => ({ id: randomUUID(), name: file.name.replace(/[\\/\r\n\u0000-\u001f]/g, "_").slice(0, 200), data: new Uint8Array(await file.arrayBuffer()) })))
  const record = {
    ...input,
    id: randomUUID(),
    requestNumber: `ST-${now.slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: "submitted",
    createdAt: now, updatedAt: now,
    notificationStatus: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? "pending" : "not_configured",
    attachments: attachments.map(({ id, name, data }) => ({ id, name, size: data.length })),
  } as RequestRecord
  await insertSqliteRequest(record, attachments)
  // Delivery failures must never undo a saved request or ask the client to resubmit.
  await notifyCustomerRequest(record.id).catch(() => undefined)
  return { success: true, requestId: record.id, requestNumber: record.requestNumber, message: `Заявка ${record.requestNumber} принята. Мы свяжемся с вами для уточнения деталей.` }
}

export async function notifyCustomerRequest(id: string) {
  const record = await getSqliteRequest(id)
  if (!record) return null
  if (record.notificationStatus === "sent") return record
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return updateSqliteRequest(id, { notificationStatus: "not_configured" })
  await updateSqliteRequest(id, { notificationStatus: "pending" })
  try {
    const labels = { contact: "Обращение", quote: "Запрос КП", custom: "Заявка по ТЗ" }
    const name = record.kind === "quote" ? record.data.contactName : record.data.name
    const detail = record.kind === "quote"
      ? `${record.data.company}\nТоваров: ${record.data.items.length}\n${record.data.comment}`
      : record.kind === "custom" ? `${record.data.productType}, количество: ${record.data.quantity}\n${record.data.comment}`
      : `${record.data.subject}\n${record.data.message}`
    const text = `${labels[record.kind]} ${record.requestNumber}\n${name}\nТелефон: ${record.data.phone || "не указан"}\nEmail: ${record.data.email}\n${detail.slice(0, 1500)}\nФайлов: ${record.attachments.length}\nОткройте раздел заявок в админке сайта.`
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    const result = await response.json().catch(() => null) as { ok?: boolean } | null
    return updateSqliteRequest(id, { notificationStatus: response.ok && result?.ok === true ? "sent" : "failed" })
  } catch {
    return updateSqliteRequest(id, { notificationStatus: "failed" })
  }
}
