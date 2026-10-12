import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { Toaster } from "sonner"
import { siteConfig } from "@/lib/config"
import { getSiteSettings } from '@/lib/content/site-settings'
import { SessionProvider } from '@/components/auth/session-provider'
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
})

const defaultMetadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: siteConfig.url },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale.replace("-", "_"),
    images: [
      {
        url: "/images/hero-park-composite.png",
        width: 2048,
        height: 1152,
        alt: "Городской парк с металлическими изделиями СИБ-ТРЕЙД",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/hero-park-composite.png"],
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return { ...defaultMetadata, title: { default: `${settings.name} — ${settings.tagline}`, template: `%s | ${settings.name}` }, description: settings.description, openGraph: { ...defaultMetadata.openGraph, siteName: settings.name } }
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const settings = await getSiteSettings()

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([{ ...organizationJsonLd, name: settings.name }, { ...websiteJsonLd, name: settings.name }]).replaceAll('<', '\\u003c'),
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
