"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { contactFormSchema, type ContactFormData } from "@/lib/validators"

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
  const [form, setForm] = useState<ContactFormData>(initialForm)
  const [loading, setLoading] = useState(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = contactFormSchema.safeParse(form)
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Проверьте данные формы")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      const payload = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(payload.message ?? "Не удалось отправить обращение")
      toast.success(payload.message ?? "Обращение отправлено")
      setForm(initialForm)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить обращение")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="contact-form" onSubmit={handleSubmit} className="border border-border bg-background p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="contact-name">Имя</Label><Input id="contact-name" name="name" value={form.name} onChange={handleChange} placeholder="Ваше имя" required /></div>
        <div className="space-y-2"><Label htmlFor="contact-company">Компания</Label><Input id="contact-company" name="company" value={form.company} onChange={handleChange} placeholder="Название компании" /></div>
        <div className="space-y-2"><Label htmlFor="contact-phone">Телефон</Label><Input id="contact-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" type="tel" /></div>
        <div className="space-y-2"><Label htmlFor="contact-email">Email</Label><Input id="contact-email" name="email" value={form.email} onChange={handleChange} placeholder="name@company.ru" type="email" required /></div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="contact-subject">Тема обращения</Label><select id="contact-subject" name="subject" value={form.subject} onChange={handleChange} className="h-10 w-full border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30" required><option value="">Выберите тему</option><option>Получить расчёт</option><option>Заказать звонок</option><option>Вопрос по каталогу</option><option>Сотрудничество</option><option>Другое</option></select></div>
        <div className="space-y-2"><Label htmlFor="contact-method">Удобный способ связи</Label><select id="contact-method" name="preferredContact" value={form.preferredContact} onChange={handleChange} className="h-10 w-full border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"><option value="phone">Телефон</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></div>
      </div>
      <div className="mt-5 space-y-2"><Label htmlFor="contact-message">Сообщение</Label><Textarea id="contact-message" name="message" value={form.message} onChange={handleChange} placeholder="Опишите задачу, изделие или вопрос" rows={6} required /></div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"><p className="max-w-md text-xs leading-5 text-muted-foreground">Отправляя форму, вы передаёте данные для обработки обращения специалистом СИБ-ТРЕЙД.</p><Button type="submit" disabled={loading}>{loading ? "Отправляем..." : "Отправить обращение"}</Button></div>
    </form>
  )
}
