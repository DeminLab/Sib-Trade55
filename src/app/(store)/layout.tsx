import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { LegacyCartMigration } from "@/components/quote/legacy-cart-migration"
import { BackToTop } from "@/components/layout/back-to-top"
import { categoryRepository } from "@/lib/repositories"
import { getSiteSettings } from '@/lib/content/site-settings'
import { SiteSettingsProvider } from '@/components/layout/site-settings-provider'
import { SiteVisitTracker } from '@/components/analytics/site-visit-tracker'

export const dynamic = "force-dynamic"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch category tree server-side so the Header doesn't depend on
  // a specific data source — the repository layer handles that.
  const [categories, settings] = await Promise.all([categoryRepository.list(), getSiteSettings()])

  return (
    <SiteSettingsProvider value={settings}>
      <SiteVisitTracker />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Перейти к содержимому
      </a>
      <AnnouncementBar />
      <Header categories={categories} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer categories={categories} settings={settings} />
      <LegacyCartMigration />
      <BackToTop />
    </SiteSettingsProvider>
  )
}
