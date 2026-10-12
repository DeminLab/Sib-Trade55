"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCardLayout } from "@/components/auth/auth-card-layout"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    toast.error('Восстановление по email не подключено. Обратитесь к администратору сайта.')
  }

  return (
    <AuthCardLayout
title="Сброс пароля"
      subtitle="Восстановление пароля по email пока не подключено. Обратитесь к администратору сайта."
      footerText="Помните пароль?"
      footerLinkText="Войти"
      footerLinkHref="/auth/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled className="w-full">Восстановление пока недоступно</Button>
      </form>
    </AuthCardLayout>
  )
}
