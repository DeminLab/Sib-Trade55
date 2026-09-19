"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { newsletterService } from "@/lib/services"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await newsletterService.subscribe(email)
      toast.success("Спасибо за подписку!")
      setEmail("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось оформить подписку")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md gap-2">
      <input
        type="email"
        placeholder="Введите ваш email"
        aria-label="Email для подписки"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        suppressHydrationWarning
        className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
      <Button variant="secondary" type="submit" disabled={loading}>
        {loading ? "..." : "Подписаться"}
      </Button>
    </form>
  )
}
