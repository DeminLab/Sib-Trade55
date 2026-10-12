"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Package, MapPin, Settings, Heart, LogOut } from "lucide-react"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { useAuthStore } from "@/store/auth"
import { ShieldCheck } from "lucide-react"
import { toast } from 'sonner'

const accountLinks = [
  { name: "Заказы", description: "История заказов и отслеживание доставки", href: "/account/orders", icon: Package },
  { name: "Адреса", description: "Управление адресами доставки и оплаты", href: "/account/addresses", icon: MapPin },
  { name: "Избранное", description: "Сохранённые товары", href: "/wishlist", icon: Heart },
  { name: "Настройки", description: "Обновление профиля и настроек", href: "/account/settings", icon: Settings },
]

export default function AccountPage() {
  const { user, isReady } = useAuthGuard()
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  if (!isReady) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
<PageHeader title="Мой аккаунт" description={`Добро пожаловать, ${user?.firstName}!`}>
        <Button variant="outline" onClick={async () => { try { await logout(); router.push('/'); router.refresh() } catch { toast.error('Не удалось выйти. Повторите попытку.') } }}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </PageHeader>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {accountLinks.map((item) => (
          <Link key={item.name} href={item.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {user?.role === "admin" && (
          <Link href="/admin">
            <Card className="h-full border-primary/30 transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Админ-панель
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Управление товарами, категориями и заявками</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
