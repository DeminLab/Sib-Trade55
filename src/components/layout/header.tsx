"use client"

import Link from "next/link"
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  Heart,
  LogOut,
  ChevronDown,
  ArrowUpRight,
  X,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchModal } from "@/components/search/search-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { mobileMenuSections, primaryNav } from "@/lib/navigation"
import { siteConfig } from "@/lib/config"
import { useTranslations } from "next-intl"
import { useEffect, useState, useSyncExternalStore } from "react"
import type { Category } from "@/types"
import { useCartStore } from "@/store/cart"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"

function CartBadge() {
  const openCart = useCartStore((s) => s.openCart)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  const count = mounted ? getItemCount() : 0

  return (
    <button
      onClick={openCart}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-sm hover:bg-accent"
      aria-label={`${count} ${count === 1 ? "товар" : "товаров"} в корзине`}
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="icon-badge">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}

function WishlistBadge() {
  const [pop, setPop] = useState(false)

  function handleClick() {
    setPop(true)
    setTimeout(() => setPop(false), 320)
  }

  return (
    <Link
      href="/wishlist"
      onClick={handleClick}
      className="hidden h-10 w-10 items-center justify-center rounded-sm hover:bg-accent lg:inline-flex"
      aria-label="Избранное"
    >
      <Heart className={cn("h-[18px] w-[18px]", pop && "heart-pop")} />
    </Link>
  )
}

interface HeaderProps {
  /** All categories (top-level + subcategories) from the repository layer */
  categories?: Category[]
}

export function Header({ categories = [] }: HeaderProps) {
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === "Escape") setCatalogOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const rootCategories = categories
    .filter((category) => !category.parentId)
    .sort((a, b) => a.order - b.order)

  function getChildren(category: Category) {
    return categories
      .filter((item) => item.parentId === category.id)
      .sort((a, b) => a.order - b.order)
  }

  function closeCatalog() {
    setCatalogOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:gap-4 lg:px-8">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-foreground/70 hover:bg-accent hover:text-foreground lg:hidden"
              aria-label={t("openMenu")}
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="!w-full !gap-0 !border-r-border sm:!w-[26rem]"
              showCloseButton={false}
            >
              <div className="flex items-center justify-between border-b px-6 py-5">
                <Link
                  href="/"
                  className="text-lg font-bold tracking-[-0.04em]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {siteConfig.name}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={tCommon("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
                <div className="border-b py-5">
                  <Link
                    href="/shop"
                    className="flex items-center justify-between py-2 text-base font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Каталог
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </Link>
                  <div className="mt-3 space-y-1 border-l border-line-strong pl-4">
                    {rootCategories.map((category) => {
                      const children = getChildren(category)
                      const isExpanded = expandedCategory === category.id

                      return (
                        <div key={category.id}>
                          <div className="flex items-center">
                            <Link
                              href={`/${category.slug}`}
                              className="flex-1 py-2 text-sm font-medium hover:text-primary"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                            {children.length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedCategory(isExpanded ? null : category.id)
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                                aria-label={`${isExpanded ? "Свернуть" : "Развернуть"} ${category.name}`}
                                aria-expanded={isExpanded}
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                              </button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="mb-2 ml-3 border-l border-border pl-3">
                              {children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={`/${child.slug}`}
                                  className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {mobileMenuSections.map((section) => (
                  <div key={section.label} className="border-b py-5">
                    <p className="industrial-label mb-3">{section.label}</p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={`${section.label}-${item.name}`}
                          href={item.href}
                          className="block py-2 text-sm font-medium hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <Button asChild className="mt-6 w-full">
                  <Link href="/custom" onClick={() => setMobileMenuOpen(false)}>
                    Получить расчёт
                    <ArrowUpRight />
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="shrink-0 text-[1.25rem] font-bold tracking-[-0.055em] 2xl:text-[1.5rem]"
          >
            {siteConfig.name}
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex 2xl:gap-5">
            <div
              className="relative"
              onMouseEnter={() => setCatalogOpen(true)}
              onMouseLeave={() => setCatalogOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 items-center gap-1 rounded-sm px-1.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-primary 2xl:gap-1.5 2xl:px-2 2xl:text-sm",
                  catalogOpen && "bg-accent text-primary"
                )}
                onClick={() => setCatalogOpen((open) => !open)}
                aria-expanded={catalogOpen}
                aria-haspopup="true"
              >
                Каталог
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", catalogOpen && "rotate-180")}
                />
              </button>

              {catalogOpen && (
                <div className="absolute top-full left-1/2 w-[min(100vw-2rem,1120px)] -translate-x-1/2 border-t-2 border-primary bg-white py-8 shadow-[0_24px_50px_-30px_oklch(0.2_0.02_255/0.55)]">
                  <div className="grid grid-cols-[220px_1fr] gap-10 px-8">
                    <div className="border-r border-border pr-8">
                      <p className="industrial-label">Каталог</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                        Материалы и решения
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Для строительства, благоустройства и промышленных объектов.
                      </p>
                      <Link
                        href="/shop"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        onClick={closeCatalog}
                      >
                        Весь каталог <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                      {rootCategories.map((category) => {
                        const children = getChildren(category)
                        return (
                          <div key={category.id}>
                            <Link
                              href={`/${category.slug}`}
                              className="group inline-flex items-center gap-1 text-sm font-semibold hover:text-primary"
                              onClick={closeCatalog}
                            >
                              {category.name}
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                            </Link>
                            {children.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {children.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={`/${child.slug}`}
                                    className="block text-xs leading-5 text-muted-foreground hover:text-foreground"
                                    onClick={closeCatalog}
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {primaryNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="whitespace-nowrap text-[0.72rem] font-medium text-foreground/80 transition-colors hover:text-primary 2xl:text-sm"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm hover:bg-accent hover:text-primary"
              aria-label={t("searchProducts")}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <WishlistBadge />

            {mounted && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="hidden h-10 w-10 items-center justify-center rounded-sm hover:bg-accent lg:inline-flex"
                  aria-label={t("accountMenu")}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-foreground text-xs font-semibold text-background">
                    {user?.firstName?.[0] ?? "U"}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    Мой аккаунт
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/orders")}>
                    {tCommon("orders")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/settings")}>
                    Настройки
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      router.push("/")
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tCommon("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/auth/login"
                className="hidden h-10 w-10 items-center justify-center rounded-sm hover:bg-accent hover:text-primary lg:inline-flex"
                aria-label={tCommon("signIn")}
              >
                <User className="h-[18px] w-[18px]" />
              </Link>
            )}

            <CartBadge />

            <Button asChild size="sm" className="ml-1 hidden min-[1400px]:inline-flex">
              <Link href="/custom">
                Получить расчёт
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
