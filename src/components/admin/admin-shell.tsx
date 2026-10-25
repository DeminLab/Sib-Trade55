"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, Archive, Boxes, BriefcaseBusiness, ClipboardList, FileText, FolderKanban, LayoutDashboard, Menu, Package, Tags, Users, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AdminGlobalSearch } from "@/components/admin/admin-global-search"
import { cn } from "@/lib/utils"
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

const adminNavGroups = [
  { name: "Работа с клиентами", items: [
    { name: "Обзор", href: "/admin", icon: LayoutDashboard },
    { name: "Заказы", href: "/admin/orders", icon: Package },
    { name: "Обращения", href: "/admin/contacts", icon: FileText },
    { name: "Запросы КП", href: "/admin/quotes", icon: ClipboardList },
    { name: "Подбор и поставка", href: "/admin/custom-requests", icon: BriefcaseBusiness },
    { name: "Клиенты", href: "/admin/customers", icon: Users },
    { name: "Посещения", href: "/admin/visitors", icon: Activity },
  ] },
  { name: "Каталог", items: [
    { name: "Все товары", href: "/admin/products", icon: Boxes },
    { name: "Категории", href: "/admin/categories", icon: Tags },
  ] },
  { name: "Сайт", items: [
    { name: "Портфолио", href: "/admin/portfolio", icon: FolderKanban },
    { name: "Контент", href: "/admin/content", icon: FileText },
    { name: "Настройки", href: "/admin/settings", icon: FileText },
  ] },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Разделы админки" className="space-y-6">
      {adminNavGroups.map((group) => <section key={group.name}>
        <h2 className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group.name}</h2>
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "group flex min-h-10 items-center gap-3 border-l-2 px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "border-primary bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:border-primary/40 hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </section>)}
    </nav>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const pathname = usePathname()
  const currentSection = adminNavGroups.flatMap((group) => group.items).find((item) => item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))
  const router = useRouter()
  async function signOut() {
    setSigningOut(true)
    try { await useAuthStore.getState().logout(); router.push('/auth/login'); router.refresh() }
    catch { toast.error('Не удалось выйти. Повторите попытку.'); setSigningOut(false) }
  }

  return (
    <div className="min-h-screen bg-surface-subtle text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-border px-7">
          <Link href="/admin" className="text-xl font-bold tracking-[-0.04em]">СИБ-ТРЕЙД</Link>
          <span className="ml-3 border-l border-border pl-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6"><NavItems /></div>
        <div className="mt-auto border-t border-border p-5"><Link href="/" className="flex items-center gap-2 px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><Archive className="size-4" />На сайт</Link></div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-bold tracking-[-0.04em]">СИБ-ТРЕЙД <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Admin</span></Link>
          <SheetTrigger render={<Button size="icon" variant="outline" aria-label="Открыть меню"><Menu className="size-5" /></Button>} />
        </div>
        <SheetContent side="left" className="w-[min(86vw,320px)] p-0">
          <SheetHeader className="border-b border-border px-6 py-5"><SheetTitle className="text-left">Разделы управления</SheetTitle></SheetHeader>
          <div className="overflow-y-auto px-4 py-6"><NavItems onNavigate={() => setMobileOpen(false)} /></div>
          <div className="mt-auto border-t border-border p-5"><Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><X className="size-4" />На сайт</Link></div>
        </SheetContent>
      </Sheet>

      <main className="min-h-screen min-w-0 lg:pl-64"><div className="mx-auto max-w-[1600px] px-4 pb-8 pt-3.5 min-[420px]:px-5 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10 lg:pb-12">
        <div className="mb-7 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1"><AdminGlobalSearch /></div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <p className="text-xs font-medium text-muted-foreground">Админка <span className="px-1">/</span> {currentSection?.name ?? "Раздел"}</p>
            <Button variant="outline" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? 'Выходим…' : 'Выйти'}</Button>
          </div>
        </div>
        {children}
      </div></main>
    </div>
  )
}
