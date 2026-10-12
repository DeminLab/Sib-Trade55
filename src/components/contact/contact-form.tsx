"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { contactRequestSchema } from "@/lib/requests/validation"
import type { ContactFormData } from "@/lib/validators"
import type { RequestReceipt } from "@/lib/requests/types"
import { RequestFeedback } from "@/components/requests/request-feedback"

const initialForm: ContactFormData = {
  name: "",
  company: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
  preferredContact: "phone",
}

export function ContactForm() {
  const [callback, setCallback] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<ContactFormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setSuccess("")
    setErrorMessage("")
    setFieldErrors({})
    const result = contactRequestSchema.safeParse(callback ? { ...form, email: "", subject: "Заказать звонок", message: "Прошу связаться со мной по телефону.", preferredContact: "phone" } : form)
    if (!result.success) {
      setFieldErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      const field = event.currentTarget.elements.namedItem(String(result.error.issues[0]?.path[0]))
      if (field instanceof HTMLElement) field.focus()
      setErrorMessage(result.error.issues[0]?.message ?? "Проверьте данные формы")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      const payload = (await response.json()) as RequestReceipt
      if (!response.ok) throw new Error(payload.message ?? "Не удалось отправить обращение")
      toast.success(payload.message ?? "Обращение отправлено")
      setSuccess(payload.message)
      setForm(initialForm)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось отправить обращение")
      toast.error(error instanceof Error ? error.message : "Не удалось отправить обращение")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="contact-form" noValidate onSubmit={handleSubmit} className="border border-border bg-background p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Вид обращения">
        <Button type="button" variant={callback ? "default" : "outline"} aria-pressed={callback} onClick={() => { setCallback(true); setSuccess(""); setFieldErrors({}); setErrorMessage("") }}>Заказать звонок</Button>
        <Button type="button" variant={callback ? "outline" : "default"} aria-pressed={!callback} onClick={() => { setCallback(false); setSuccess(""); setFieldErrors({}); setErrorMessage("") }}>Написать сообщение</Button>
      </div>
      <RequestFeedback success={success} error={errorMessage} />
      <fieldset key={success || "editing"} disabled={loading} className="min-w-0">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="contact-name">Имя</Label><Input id="contact-name" name="name" autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "contact-name-error" : undefined} value={form.name} onChange={handleChange} placeholder="Ваше имя" required />{fieldErrors.name ? <p id="contact-name-error" className="text-sm text-destructive">{fieldErrors.name}</p> : null}</div>
        <div hidden={callback} className="space-y-2"><Label htmlFor="contact-company">Компания</Label><Input id="contact-company" name="company" autoComplete="organization" aria-invalid={Boolean(fieldErrors.company)} aria-describedby={fieldErrors.company ? "contact-company-error" : undefined} value={form.company} onChange={handleChange} placeholder="Название компании" />{fieldErrors.company ? <p id="contact-company-error" className="text-sm text-destructive">{fieldErrors.company}</p> : null}</div>
        <div className="space-y-2"><Label htmlFor="contact-phone">Телефон</Label><Input id="contact-phone" name="phone" autoComplete="tel" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined} value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" type="tel" />{fieldErrors.phone ? <p id="contact-phone-error" className="text-sm text-destructive">{fieldErrors.phone}</p> : null}</div>
        <div hidden={callback} className="space-y-2"><Label htmlFor="contact-email">Email</Label><Input id="contact-email" name="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "contact-email-error" : undefined} value={form.email} onChange={handleChange} placeholder="name@company.ru" type="email" required />{fieldErrors.email ? <p id="contact-email-error" className="text-sm text-destructive">{fieldErrors.email}</p> : null}</div>
      </div>
      <div hidden={callback} className={callback ? "hidden" : "mt-5 grid gap-5 sm:grid-cols-2"}>
        <div className="space-y-2"><Label htmlFor="contact-subject">Тема обращения</Label><select id="contact-subject" name="subject" aria-invalid={Boolean(fieldErrors.subject)} aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined} value={form.subject} onChange={handleChange} className="h-10 w-full border border-input bg-background px-3 text-base outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30" required><option value="">Выберите тему</option><option>Получить расчёт</option><option>Заказать звонок</option><option>Вопрос по каталогу</option><option>Сотрудничество</option><option>Другое</option></select>{fieldErrors.subject ? <p id="contact-subject-error" className="text-sm text-destructive">{fieldErrors.subject}</p> : null}</div>
        <div className="space-y-2"><Label htmlFor="contact-method">Удобный способ связи</Label><select id="contact-method" name="preferredContact" value={form.preferredContact} onChange={handleChange} className="h-10 w-full border border-input bg-background px-3 text-base outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="phone">Телефон</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></div>
      </div>
      <div hidden={callback} className="mt-5 space-y-2"><Label htmlFor="contact-message">Сообщение</Label><Textarea id="contact-message" name="message" aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? "contact-message-error" : undefined} value={form.message} onChange={handleChange} placeholder="Опишите задачу, изделие или вопрос" rows={6} required />{fieldErrors.message ? <p id="contact-message-error" className="text-sm text-destructive">{fieldErrors.message}</p> : null}</div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"><p className="max-w-md text-xs leading-5 text-muted-foreground">Отправляя форму, вы передаёте данные для обработки обращения специалистом СИБ-ТРЕЙД.</p><Button type="submit" disabled={loading}>{loading ? "Отправляем…" : callback ? "Жду звонка" : "Отправить обращение"}</Button></div>
      </fieldset>
    </form>
  )
}
