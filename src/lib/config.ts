// ============================================================================
// Конфигурация сайта — единственный источник всех настроек магазина.
// Редактируйте этот файл для настройки названия, контактов и т.д.
// ============================================================================

export const siteConfig = {
  // Бренд
  name: "СИБ-ТРЕЙД",
  tagline: "Металлоконструкции, сантехника и стройматериалы",
  description:
    "Продажа и поставка металлоконструкций, сантехники, строительных материалов и оборудования. Качество, надёжность, индивидуальный подход.",

  // Баннер (установите "" для скрытия)
  announcement: "Бесплатная доставка от 50 000 ₽ — Закажите сейчас!",

  // URLs
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2000",

  // Контакты
  contact: {
    email: "info@sib-trade.ru",
    phone: "+7 (383) 123-45-67",
    workingHours: "Пн–Пт, 09:00–18:00",
    messengers: {
      whatsapp: "https://wa.me/73831234567",
      telegram: "https://t.me/sib_trade",
    },
    address: {
      street: "ул. Промышленная",
      suite: "15",
      city: "Новосибирск",
      state: "Новосибирская область",
      zip: "630099",
    },
    requisites: {
      legalName: "ООО «СИБ-ТРЕЙД»",
      inn: "5400000000",
      kpp: "540001001",
      ogrn: "1205400000000",
      bank: "ПАО «Сибирский банк»",
      checkingAccount: "40702810000000000001",
      correspondentAccount: "30101810000000000001",
      bik: "045004000",
    },
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=82.870%2C55.015%2C82.940%2C55.055&layer=mapnik&marker=55.035%2C82.905",
  },

  // Соцсети (установите "" для скрытия)
  social: {
    twitter: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
  },

  // Доставка
  freeShippingThreshold: 50000, // 50 000 ₽
  taxRate: 0, // 0% (НДС включён в цену)

  // Валюта и локаль
  currency: "RUB",
  locale: "ru-RU",

  // Авторское право
  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
