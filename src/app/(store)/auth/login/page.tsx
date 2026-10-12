"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCardLayout } from "@/components/auth/auth-card-layout"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { loginSchema } from "@/lib/validators"

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    setLoading(true)
    const success = await login(email, password)
    if (success) {
      toast.success("С возвращением!")
      const next = new URLSearchParams(window.location.search).get("next")
      let destination: URL | null = null
      try { destination = next ? new URL(next, window.location.origin) : null } catch { /* ignore malformed redirect */ }
      router.push(destination?.origin === window.location.origin
        ? `${destination.pathname}${destination.search}${destination.hash}`
        : useAuthStore.getState().user?.role === 'admin' ? '/admin' : '/account')
    } else {
      toast.error(useAuthStore.getState().authError || 'Не удалось выполнить вход. Повторите попытку.')
    }
    setLoading(false)
  }

  return (
    <AuthCardLayout
title="С возвращением"
      subtitle="Войдите в аккаунт, чтобы продолжить"
      footerText="Нет аккаунта?"
      footerLinkText="Зарегистрироваться"
      footerLinkHref="/auth/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" autoComplete="username" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
<Label htmlFor="password">Пароль</Label>
            <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Забыли пароль?
            </Link>
          </div>
          <Input id="password" name="password" autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
