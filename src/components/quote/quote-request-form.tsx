"use client"

import { useState } from "react"
import { LoaderCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { QuoteContactMethod, QuoteRequest, QuoteRequestItem } from "@/types"
import { quoteRequestService } from "@/lib/services/client-services"
import { quoteRequestSchema } from "@/lib/requests/validation"
import type { RequestReceipt } from "@/lib/requests/types"
import { RequestFeedback } from "@/components/requests/request-feedback"

interface QuoteRequestFormProps {
  items: QuoteRequestItem[]
  onSubmit?: (request: QuoteRequest) => Promise<void> | void
  onSuccess?: (receipt: RequestReceipt | null) => void
}

const initialForm = {
  company: "",
  inn: "",
  contactName: "",
  phone: "",
  email: "",
  comment: "",
  desiredTerm: "",
  preferredContact: "phone" as QuoteContactMethod,
}

export function QuoteRequestForm({ items, onSubmit, onSuccess }: QuoteRequestFormProps) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setSuccess("")
    setErrorMessage("")
    const parsed = quoteRequestSchema.safeParse({ ...form, items })
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Проверьте данные заявки")
      return
    }

    const request: QuoteRequest = {
      ...parsed.data,
    }

    setLoading(true)
    try {
      let receipt: RequestReceipt | null = null
      if (onSubmit) {
        await onSubmit(request)
      } else {
        receipt = await quoteRequestService.create(request)
      }
      const message = receipt?.message ?? "Запрос КП отправлен. Мы свяжемся с вами для уточнения деталей."
      toast.success(message)
      setSuccess(message)
      setForm(initialForm)
      onSuccess?.(receipt)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отправить запрос. Попробуйте ещё раз."
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-background p-5 sm:p-8">
      <RequestFeedback success={success} error={errorMessage} />
      <fieldset disabled={loading} className="min-w-0">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="quote-company">Компания (необязательно)</Label><Input id="quote-company" name="company" value={form.company} onChange={handleChange} placeholder="ООО «Название компании»" autoComplete="organization" /></div>
        <div className="space-y-2"><Label htmlFor="quote-inn">ИНН (необязательно)</Label><Input id="quote-inn" name="inn" value={form.inn} onChange={handleChange} placeholder="10 или 12 цифр" inputMode="numeric" /></div>
        <div className="space-y-2"><Label htmlFor="quote-contact-name">Контактное лицо</Label><Input id="quote-contact-name" name="contactName" autoComplete="name" value={form.contactName} onChange={handleChange} placeholder="Имя и должность" required /></div>
        <div className="space-y-2"><Label htmlFor="quote-phone">Телефон</Label><Input id="quote-phone" name="phone" autoComplete="tel" value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" type="tel" required /></div>
        <div className="space-y-2"><Label htmlFor="quote-email">Email (необязательно для звонка)</Label><Input id="quote-email" name="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="name@company.ru" type="email" required={form.preferredContact === "email"} /></div>
        <div className="space-y-2"><Label htmlFor="quote-term">Желаемый срок</Label><Input id="quote-term" name="desiredTerm" value={form.desiredTerm} onChange={handleChange} placeholder="Например, до 30 ноября" /></div>
        <div className="space-y-2"><Label htmlFor="quote-contact-method">Способ связи</Label><select id="quote-contact-method" name="preferredContact" value={form.preferredContact} onChange={handleChange} className="h-10 w-full border border-input bg-background px-3 text-base outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="phone">Телефон</option><option value="email">Email</option></select></div>
      </div>
      <div className="mt-5 space-y-2"><Label htmlFor="quote-comment">Комментарий</Label><Textarea id="quote-comment" name="comment" value={form.comment} onChange={handleChange} rows={5} placeholder="Дополнительные требования к поставке, документам или срокам" /></div>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-xs leading-5 text-muted-foreground">Запрос не является заказом. После отправки специалист уточнит параметры и подготовит коммерческое предложение.</p><Button type="submit" size="lg" disabled={loading}>{loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}{loading ? "Отправляем…" : "Отправить заявку"}</Button></div>
      </fieldset>
    </form>
  )
}
