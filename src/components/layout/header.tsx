"use client"

import Link from "next/link"
import Image from "@/components/ui/catalog-image"
import {
  Search,
  ShoppingBag,
  FileText,
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
import { mobileMenuSections as defaultMobileSections } from "@/lib/navigation"
import { useSiteSettings } from './site-settings-provider'
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { Category } from "@/types"
import { useQuoteStore } from "@/store/quote"
import { useCartStore } from "@/store/cart"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import { toast } from 'sonner'

function CartBadge() {
  const openCart = useCartStore((s) => s.openCart)
  const itemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0))
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  const count = mounted ? itemCount : 0

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
  const siteConfig = useSiteSettings()
  const primaryNav = siteConfig.navigation
  const mobileMenuSections = [{ label: 'Компания', items: primaryNav }, ...defaultMobileSections.slice(1)]
  const quoteCount = useQuoteStore((state) => state.items.length)
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [catalogPanelTop, setCatalogPanelTop] = useState(0)
  const headerRef = useRef<HTMLElement>(null)
  const catalogCloseTimerRef = useRef<number | null>(null)
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
      if (event.key === "Escape") closeCatalog()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (catalogCloseTimerRef.current !== null) {
        window.clearTimeout(catalogCloseTimerRef.current)
        catalogCloseTimerRef.current = null
      }
    }
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
    if (catalogCloseTimerRef.current !== null) {
      window.clearTimeout(catalogCloseTimerRef.current)
      catalogCloseTimerRef.current = null
    }
    setCatalogOpen(false)
  }

  function scheduleCatalogClose() {
    if (catalogCloseTimerRef.current !== null) {
      window.clearTimeout(catalogCloseTimerRef.current)
    }
    catalogCloseTimerRef.current = window.setTimeout(() => {
      catalogCloseTimerRef.current = null
      setCatalogOpen(false)
    }, 350)
  }

  function cancelCatalogClose() {
    if (catalogCloseTimerRef.current === null) return
    window.clearTimeout(catalogCloseTimerRef.current)
    catalogCloseTimerRef.current = null
  }

  function openCatalog() {
    cancelCatalogClose()
    const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 72
    setCatalogPanelTop(Math.ceil(headerBottom + 12))
    setCatalogOpen(true)
  }

  useEffect(() => {
    if (!catalogOpen) return

    const updateCatalogPanelPosition = () => {
      const headerBottom = headerRef.current?.getBoundingClientRect().bottom
      if (headerBottom !== undefined) setCatalogPanelTop(Math.ceil(headerBottom + 12))
    }

    window.addEventListener("resize", updateCatalogPanelPosition)
    window.addEventListener("scroll", updateCatalogPanelPosition, { passive: true })
    window.addEventListener("announcement-change", updateCatalogPanelPosition)

    return () => {
      window.removeEventListener("resize", updateCatalogPanelPosition)
      window.removeEventListener("scroll", updateCatalogPanelPosition)
      window.removeEventListener("announcement-change", updateCatalogPanelPosition)
    }
  }, [catalogOpen])

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/95">
        <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center gap-1 px-3 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-foreground/70 hover:bg-accent hover:text-foreground lg:hidden"
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

                <a className="mt-5 py-3 text-lg font-semibold" href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>
                <Button asChild className="mt-6 w-full">
                  <Link href="/custom#request" onClick={() => setMobileMenuOpen(false)}>
                    Получить расчёт
                    <ArrowUpRight />
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-[-0.055em] 2xl:text-[1.5rem]"
          >
            {siteConfig.name}
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-2 2xl:gap-5">
            <div
              className="relative"
              onMouseEnter={openCatalog}
              onMouseLeave={scheduleCatalogClose}
            >
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 items-center gap-1 rounded-sm px-1.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-primary xl:px-2 2xl:gap-1.5 2xl:text-sm",
                  catalogOpen && "bg-accent text-primary"
                )}
                onClick={openCatalog}
                aria-expanded={catalogOpen}
                aria-haspopup="true"
              >
                Каталог
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", catalogOpen && "rotate-180")}
                />
              </button>

              {catalogOpen && (
                <div
                  className="fixed left-1/2 z-50 w-[min(calc(100vw-2rem),1480px)] -translate-x-1/2 overflow-y-auto border-t-2 border-primary bg-white shadow-[0_24px_50px_-30px_oklch(0.2_0.02_255/0.55)]"
                  style={{ top: catalogPanelTop, maxHeight: `calc(100dvh - ${catalogPanelTop + 16}px)` }}
                  onMouseEnter={cancelCatalogClose}
                  onMouseLeave={scheduleCatalogClose}
                >
                  <div className="grid gap-6 p-5 lg:grid-cols-[minmax(250px,0.78fr)_2fr] lg:gap-7 lg:p-7">
                    {rootCategories.slice(0, 1).map((category) => {
                      const imageUrl = category.image?.url
                      return (
                        <Link
                          key={category.id}
                          href={`/${category.slug}`}
                          onClick={closeCatalog}
                          className="group relative isolate flex min-h-[220px] overflow-hidden bg-slate-900 text-white lg:min-h-[340px]"
                        >
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={category.image?.alt || category.name}
                              fill
                              sizes="(max-width: 1024px) 100vw, 320px"
                              className="-z-20 object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : null}
                          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-900/5" />
                          <span className="mt-auto block p-6">
                            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Каталог решений</span>
                            <span className="block max-w-sm text-2xl font-semibold leading-tight tracking-[-0.035em]">{category.name}</span>
                            {category.description ? <span className="mt-2 block line-clamp-2 max-w-sm text-sm leading-5 text-white/75">{category.description}</span> : null}
                            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Смотреть каталог <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                          </span>
                        </Link>
                      )
                    })}

                    <div className="flex min-w-0 flex-col">
                      <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
                        <div>
                          <p className="industrial-label">Выберите направление</p>
                          <p className="mt-1 text-sm text-muted-foreground">Подборки для городской среды и частных территорий</p>
                        </div>
                        <Link href="/shop" onClick={closeCatalog} className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline sm:inline-flex">Весь каталог <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                      </div>
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {rootCategories.flatMap(getChildren).map((category) => (
                          <Link
                            key={category.id}
                            href={`/${category.slug}`}
                            onClick={closeCatalog}
                            className="group flex min-h-[92px] items-center gap-3 border border-border/70 bg-white p-2.5 transition-colors hover:border-primary/40 hover:bg-accent/50"
                          >
                            <span className="relative h-[68px] w-[76px] shrink-0 overflow-hidden bg-stone-50 ring-1 ring-inset ring-border/60">
                              {category.image?.url ? (
                                <Image
                                  src={category.image.url}
                                  alt={category.image.alt || category.name}
                                  fill
                                  sizes="76px"
                                  className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : <span className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-1 text-[13px] font-semibold leading-4 text-foreground group-hover:text-primary">
                                <span>{category.name}</span>
                                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                              </span>
                              {category.description ? <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">{category.description}</span> : null}
                            </span>
                          </Link>
                        ))}
                        {rootCategories.length === 0 ? <p className="col-span-full py-8 text-sm text-muted-foreground">Категории временно недоступны. Откройте полный каталог.</p> : null}
                      </div>
                      <Link href="/shop" onClick={closeCatalog} className="mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline sm:hidden">Весь каталог <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {primaryNav.filter((item) => ["/how-we-work", "/cases", "/contact"].includes(item.href)).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-foreground/80 transition-colors hover:text-primary 2xl:text-sm"
              >
                {item.name}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-medium">Компания <ChevronDown className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent>{primaryNav.filter((item) => !["/how-we-work", "/cases", "/contact"].includes(item.href)).map((item) => <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>{item.name}</DropdownMenuItem>)}</DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-sm hover:bg-accent hover:text-primary xl:w-auto xl:px-3"
              aria-label={t("searchProducts")}
            >
              <Search className="h-[18px] w-[18px]" /><span className="hidden text-sm xl:inline">Поиск</span>
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
                    onClick={async () => {
                      try { await logout(); router.push('/'); router.refresh() } catch { toast.error('Не удалось выйти. Повторите попытку.') }
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

            <Link href="/quote" className="relative inline-flex size-11 items-center justify-center rounded-sm hover:bg-accent" aria-label={`Товары для расчёта: ${mounted ? quoteCount : 0}`}><FileText className="size-[18px]" />{mounted && quoteCount > 0 ? <span className="icon-badge">{quoteCount}</span> : null}</Link>
            <CartBadge />

            <Button asChild size="sm" className="ml-1 hidden min-[1400px]:inline-flex">
              <Link href="/custom#request">
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
