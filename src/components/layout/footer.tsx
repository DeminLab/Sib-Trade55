import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/lib/config"

const footerLinks = {
  shop: [
    { name: "Все товары", href: "/shop" },
    { name: "Металлоконструкции", href: "/metallokonstruktsii" },
    { name: "Сантехника", href: "/santehnika" },
    { name: "Стройматериалы", href: "/stroymaterialy" },
    { name: "Инструменты", href: "/instrumenty" },
  ],
  company: [
    { name: "О компании", href: "/about" },
    { name: "Контакты", href: "/contact" },
    { name: "Доставка и оплата", href: "/policies/shipping" },
    { name: "FAQ", href: "/faq" },
  ],
  legal: [
    { name: "Доставка", href: "/policies/shipping" },
    { name: "Возврат", href: "/policies/returns" },
    { name: "Политика конфиденциальности", href: "/policies/privacy" },
    { name: "Условия использования", href: "/policies/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              {siteConfig.name}
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {siteConfig.tagline}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {siteConfig.contact.phone}
            </p>
            <p className="text-sm text-muted-foreground">
              {siteConfig.contact.address.city}, {siteConfig.contact.address.street}, {siteConfig.contact.address.suite}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold">Каталог</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">Компания</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold">Информация</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {siteConfig.copyrightYear} {siteConfig.name}. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}
