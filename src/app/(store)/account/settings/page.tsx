"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, isReady } = useAuthGuard()
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const [firstName, setFirstName] = useState(() => user?.firstName ?? "")
  const [lastName, setLastName] = useState(() => user?.lastName ?? "")
  const [email, setEmail] = useState(() => user?.email ?? "")

  if (!isReady) return null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (await updateProfile({ firstName, lastName, email })) toast.success("Профиль обновлён")
    else toast.error("Не удалось обновить профиль: backend-сервис не подключён")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader title="Настройки" />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Информация профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 min-[480px]:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit">Сохранить</Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Изменить пароль</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); toast.error("Смена пароля будет доступна после подключения backend-сервиса") }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input id="currentPassword" autoComplete="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input id="newPassword" autoComplete="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
              <Input id="confirmPassword" autoComplete="new-password" type="password" />
            </div>
            <Button type="submit">Обновить пароль</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
