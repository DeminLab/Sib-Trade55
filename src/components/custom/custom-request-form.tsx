"use client"

import { useRef, useState } from "react"
import { FileUp, LoaderCircle, Paperclip, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { customRequestService } from "@/lib/services/client-services"
import { attachmentExtensions, customRequestSchema, maxAttachmentCount, maxAttachmentSize } from "@/lib/requests/validation"
import { RequestFeedback } from "@/components/requests/request-feedback"

export interface CustomRequestPayload {
  name: string
  phone: string
  email: string
  productType: string
  dimensions: string
  material: string
  finish: string
  quantity: string
  comment: string
  files: File[]
}

const initialForm: Omit<CustomRequestPayload, "files"> = {
  name: "",
  phone: "",
  email: "",
  productType: "",
  dimensions: "",
  material: "",
  finish: "",
  quantity: "1",
  comment: "",
}

const acceptedTypes = ".pdf,.jpg,.jpeg,.png,.dwg,.dxf"

export function CustomRequestForm({
  onSubmit,
}: {
  onSubmit?: (payload: CustomRequestPayload) => Promise<void> | void
}) {
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])
    if (files.length + nextFiles.length > maxAttachmentCount || nextFiles.some((file) => file.size > maxAttachmentSize || !attachmentExtensions.test(file.name))) {
      setErrorMessage("Прикрепите до 5 файлов PDF, JPG, PNG, DWG или DXF размером до 10 МБ каждый")
    } else {
      setFiles((current) => [...current, ...nextFiles])
      setErrorMessage("")
    }
    event.target.value = ""
  }

  function removeFile(fileIndex: number) {
    setFiles((current) => current.filter((_, index) => index !== fileIndex))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setSuccess("")
    setErrorMessage("")
    const parsed = customRequestSchema.safeParse(form)
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Проверьте данные заявки")
      return
    }

    setLoading(true)
    const payload = { ...parsed.data, files }

    try {
      let message = "Заявка принята. Мы свяжемся с вами для уточнения деталей."
      if (onSubmit) {
        await onSubmit(payload)
      } else {
        const request = new FormData()
        Object.entries(parsed.data).forEach(([key, value]) => request.append(key, value))
        files.forEach((file) => request.append("files", file))
        message = (await customRequestService.create(request)).message
      }
      toast.success(message)
      setSuccess(message)
      setForm(initialForm)
      setFiles([])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отправить заявку. Попробуйте ещё раз."
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-background p-5 sm:p-8" encType="multipart/form-data">
      <RequestFeedback success={success} error={errorMessage} />
      <fieldset disabled={loading} className="min-w-0">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="custom-name">Имя</Label><Input id="custom-name" name="name" value={form.name} onChange={handleChange} placeholder="Ваше имя" required /></div>
        <div className="space-y-2"><Label htmlFor="custom-phone">Телефон</Label><Input id="custom-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" type="tel" required /></div>
        <div className="space-y-2"><Label htmlFor="custom-email">Email</Label><Input id="custom-email" name="email" value={form.email} onChange={handleChange} placeholder="name@company.ru" type="email" required /></div>
        <div className="space-y-2"><Label htmlFor="custom-product-type">Тип изделия</Label><select id="custom-product-type" name="productType" value={form.productType} onChange={handleChange} required className="h-10 w-full border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="">Выберите направление</option><option>Металлоконструкция</option><option>Уличная мебель</option><option>Арт-объект</option><option>Благоустройство</option><option>Световое оформление</option><option>Другое изделие</option></select></div>
        <div className="space-y-2"><Label htmlFor="custom-dimensions">Размеры</Label><Input id="custom-dimensions" name="dimensions" value={form.dimensions} onChange={handleChange} placeholder="Например, 2400 × 1200 × 900 мм" /></div>
        <div className="space-y-2"><Label htmlFor="custom-quantity">Количество</Label><Input id="custom-quantity" name="quantity" value={form.quantity} onChange={handleChange} placeholder="1" type="number" min="1" /></div>
        <div className="space-y-2"><Label htmlFor="custom-material">Материал</Label><select id="custom-material" name="material" value={form.material} onChange={handleChange} className="h-10 w-full border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="">Выберите материал</option><option>Чёрная сталь</option><option>Нержавеющая сталь</option><option>Оцинкованная сталь</option><option>Алюминий</option><option>Не знаю — подскажите</option></select></div>
        <div className="space-y-2"><Label htmlFor="custom-finish">Покрытие</Label><select id="custom-finish" name="finish" value={form.finish} onChange={handleChange} className="h-10 w-full border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="">Выберите покрытие</option><option>Порошковая окраска</option><option>Грунт и эмаль</option><option>Оцинковка</option><option>Без покрытия</option><option>Не знаю — подскажите</option></select></div>
      </div>

      <div className="mt-5 space-y-2"><Label htmlFor="custom-comment">Комментарий</Label><Textarea id="custom-comment" name="comment" value={form.comment} onChange={handleChange} rows={5} placeholder="Опишите задачу, условия эксплуатации и важные требования" /></div>

      <div className="mt-5">
        <Label>Файлы проекта</Label>
        <div className="mt-2 border border-dashed border-line-strong bg-surface-subtle p-5">
          <input ref={fileInputRef} type="file" accept={acceptedTypes} multiple onChange={handleFiles} className="sr-only" id="custom-files" />
          <label htmlFor="custom-files" className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center"><FileUp className="size-7 text-primary" /><span className="text-sm font-semibold">Прикрепить чертёж, фото или ТЗ</span><span className="text-xs text-muted-foreground">PDF, JPG, PNG, DWG, DXF · до 5 файлов по 10 МБ</span></label>
        </div>
        {files.length > 0 ? <ul className="mt-3 space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm"><span className="flex min-w-0 items-center gap-2 truncate"><Paperclip className="size-4 shrink-0 text-muted-foreground" />{file.name}</span><button type="button" onClick={() => removeFile(index)} className="text-muted-foreground transition-colors hover:text-foreground" aria-label={`Удалить файл ${file.name}`}><X className="size-4" /></button></li>)}</ul> : null}
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-xs leading-5 text-muted-foreground">Отправляя форму, вы соглашаетесь на обработку контактных данных для подготовки расчёта.</p><Button type="submit" size="lg" disabled={loading}>{loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}{loading ? "Отправляем..." : "Получить расчёт"}</Button></div>
      </fieldset>
    </form>
  )
}
