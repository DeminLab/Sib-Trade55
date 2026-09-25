export interface NavItem {
  name: string
  href: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

// Единственный источник навигации для хедера, мобильного меню и т.д.

export const primaryNav: NavItem[] = [
  { name: "Как купить", href: "/how-we-work" },
  { name: "Материалы", href: "/materials" },
      { name: "Подбор и поставка", href: "/custom" },
  { name: "Портфолио", href: "/cases" },
  { name: "О компании", href: "/about" },
  { name: "Доставка", href: "/policies/shipping" },
  { name: "Контакты", href: "/contact" },
]

export const shopLinks: NavItem[] = [
  { name: "Металлоконструкции", href: "/metallokonstruktsii" },
  { name: "Уличная мебель", href: "/ulichnaya-mebel" },
  { name: "Благоустройство", href: "/zhkh-i-blagoustroystvo" },
  { name: "Световое оформление", href: "/svetovoe-oformlenie" },
  { name: "Топиарные фигуры", href: "/topiarnye-figury" },
  { name: "Фигуры из металла", href: "/figury-iz-metalla" },
]

export const accountLinks: NavItem[] = [
  { name: "Мой аккаунт", href: "/account" },
  { name: "Избранное", href: "/wishlist" },
  { name: "Заказы", href: "/account/orders" },
]

export const infoLinks: NavItem[] = [
  { name: "О компании", href: "/about" },
  { name: "Контакты", href: "/contact" },
  { name: "Доставка", href: "/policies/shipping" },
  { name: "FAQ", href: "/faq" },
]

export const mobileMenuSections: NavSection[] = [
  { label: "Компания", items: primaryNav },
  { label: "Аккаунт", items: accountLinks },
  { label: "Дополнительно", items: [{ name: "FAQ", href: "/faq" }] },
]
