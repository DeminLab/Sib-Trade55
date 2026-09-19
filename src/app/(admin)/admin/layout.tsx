"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, Boxes, BriefcaseBusiness, ClipboardList, FileText, FolderKanban, LayoutDashboard, Menu, Package, Tags, Users, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { cn } from "@/lib/utils"

const adminNav = [
  { name: "Обзор", href: "/admin", icon: LayoutDashboard },
  { name: "Заказы", href: "/admin/orders", icon: Package },
  { name: "Товары", href: "/admin/products", icon: Boxes },
  { name: "Категории", href: "/admin/categories", icon: Tags },
  { name: "Клиенты", href: "/admin/customers", icon: Users },
  { name: "Запросы КП", href: "/admin/quotes", icon: ClipboardList },
  { name: "Заявки на подбор и поставку", href: "/admin/custom-requests", icon: BriefcaseBusiness },
  { name: "Портфолио", href: "/admin/portfolio", icon: FolderKanban },
  { name: "Контент", href: "/admin/content", icon: FileText },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {adminNav.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 border-l-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive ? "border-primary bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:border-primary/40 hover:bg-background hover:text-foreground"
            )}
          >
            <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuthGuard()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isReady) return null

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Доступ запрещён</h1>
          <p className="mt-2 text-muted-foreground">Для доступа к этой странице нужны права администратора.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">На главную</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-subtle text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-border px-7">
          <Link href="/admin" className="text-xl font-bold tracking-[-0.04em]">СИБ-ТРЕЙД</Link>
          <span className="ml-3 border-l border-border pl-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin</span>
        </div>
        <div className="px-4 py-6"><p className="px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Управление</p><NavItems /></div>
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

      <main className="min-h-screen lg:pl-64"><div className="mx-auto max-w-[1600px] p-5 sm:p-8 lg:p-12">{children}</div></main>
    </div>
  )
}
