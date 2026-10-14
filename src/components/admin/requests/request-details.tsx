import type { RequestRecord } from "@/lib/requests/types"
import { formatPrice } from "@/lib/utils"

export function RequestDetails({ record }: { record: RequestRecord }) {
  const fields = record.kind === "contact"
    ? [["Компания", record.data.company], ["Тема", record.data.subject], ["Сообщение", record.data.message], ["Способ связи", record.data.preferredContact]]
    : record.kind === "quote"
      ? [["Компания", record.data.company], ["ИНН", record.data.inn], ["Желаемый срок", record.data.desiredTerm], ["Способ связи", record.data.preferredContact], ["Комментарий", record.data.comment]]
      : [["Тип изделия", record.data.productType], ["Количество", record.data.quantity], ["Размеры", record.data.dimensions], ["Материал", record.data.material], ["Покрытие", record.data.finish], ["Комментарий", record.data.comment]]
  const contactLabels: Record<string, string> = { phone: "Телефон", email: "Email", whatsapp: "WhatsApp", telegram: "Telegram" }
  return <div className="mt-5 border-t border-border pt-5">
    <dl className="grid gap-4 sm:grid-cols-2">{fields.filter(([, value]) => Boolean(value)).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{label === "Способ связи" ? contactLabels[value ?? ""] : value}</dd></div>)}</dl>
    {record.kind === "quote" && <div className="mt-6"><h3 className="font-semibold">Состав запроса</h3><ul className="mt-3 divide-y divide-border">{record.data.items.map((item, index) => <li key={`${item.id}-${index}`} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:justify-between"><span className="min-w-0 break-words">{item.name}{item.variantName && ` — ${item.variantName}`}</span><span className="shrink-0">{item.quantity} шт. · {item.priceOnRequest ? "Цена по запросу" : formatPrice(item.price)}</span></li>)}</ul><p className="mt-2 text-xs text-muted-foreground">Стоимость и условия поставки согласует менеджер.</p></div>}
    {record.attachments.length > 0 && <div className="mt-6"><h3 className="font-semibold">Файлы проекта</h3><ul className="mt-3 space-y-2">{record.attachments.map((file) => <li key={file.id}><a className="break-words text-sm underline underline-offset-4 focus-visible:outline-2" href={`/api/admin/requests/${record.id}/files/${file.id}`}>{file.name}</a><span className="ml-2 text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} КБ</span></li>)}</ul></div>}
  </div>
}
