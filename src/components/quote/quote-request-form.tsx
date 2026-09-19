"use client"

import { useState } from "react"
import { LoaderCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { QuoteContactMethod, QuoteRequest, QuoteRequestItem } from "@/types"
import { quoteRequestService } from "@/lib/services"

interface QuoteRequestFormProps {
  items: QuoteRequestItem[]
  onSubmit?: (request: QuoteRequest) => Promise<void> | void
  onSuccess?: () => void
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

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (items.length === 0) {
      toast.error("Добавьте хотя бы один товар в запрос КП")
      return
    }
    if (!form.company || !form.contactName || !form.phone || !form.email) {
      toast.error("Заполните компанию, контактное лицо, телефон и email")
      return
    }

    const request: QuoteRequest = {
      ...form,
      items,
      status: "submitted",
      createdAt: new Date().toISOString(),
    }

    setLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(request)
      } else {
        await quoteRequestService.create(request)
      }
      toast.success("Запрос КП отправлен. Мы свяжемся с вами для уточнения деталей.")
      setForm(initialForm)
      onSuccess?.()
    } catch {
      toast.error("Не удалось отправить запрос. Попробуйте ещё раз.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-background p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="quote-company">Компания</Label><Input id="quote-company" name="company" value={form.company} onChange={handleChange} placeholder="ООО «Название компании»" required /></div>
        <div className="space-y-2"><Label htmlFor="quote-inn">ИНН</Label><Input id="quote-inn" name="inn" value={form.inn} onChange={handleChange} placeholder="10 или 12 цифр" inputMode="numeric" /></div>
        <div className="space-y-2"><Label htmlFor="quote-contact-name">Контактное лицо</Label><Input id="quote-contact-name" name="contactName" value={form.contactName} onChange={handleChange} placeholder="Имя и должность" required /></div>
        <div className="space-y-2"><Label htmlFor="quote-phone">Телефон</Label><Input id="quote-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" type="tel" required /></div>
        <div className="space-y-2"><Label htmlFor="quote-email">Email</Label><Input id="quote-email" name="email" value={form.email} onChange={handleChange} placeholder="name@company.ru" type="email" required /></div>
        <div className="space-y-2"><Label htmlFor="quote-term">Желаемый срок</Label><Input id="quote-term" name="desiredTerm" value={form.desiredTerm} onChange={handleChange} placeholder="Например, до 30 сентября" /></div>
        <div className="space-y-2"><Label htmlFor="quote-contact-method">Способ связи</Label><select id="quote-contact-method" name="preferredContact" value={form.preferredContact} onChange={handleChange} className="h-10 w-full border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="phone">Телефон</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></div>
      </div>
      <div className="mt-5 space-y-2"><Label htmlFor="quote-comment">Комментарий</Label><Textarea id="quote-comment" name="comment" value={form.comment} onChange={handleChange} rows={5} placeholder="Дополнительные требования к поставке, документам или срокам" /></div>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-xs leading-5 text-muted-foreground">Запрос не является заказом. После отправки специалист уточнит параметры и подготовит коммерческое предложение.</p><Button type="submit" size="lg" disabled={loading}>{loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}{loading ? "Отправляем..." : "Запросить КП"}</Button></div>
    </form>
  )
}
