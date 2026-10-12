import { z } from "zod"
import sanitizeHtml from 'sanitize-html'
const reserved = new Set(['about', 'account', 'admin', 'api', 'auth', 'blog', 'brands', 'cart', 'cases', 'checkout', 'contact', 'custom', 'faq', 'how-we-work', 'materials', 'pages', 'policies', 'quote', 'search', 'shop', 'wishlist'])
const catalogSlug = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).refine(value => !reserved.has(value), 'Этот адрес занят разделом сайта')

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(240),
  slug: catalogSlug,
  description: z.string().trim().max(5000),
  body: z.string().max(30000).transform(value => sanitizeHtml(value)),
  status: z.enum(["draft", "active", "archived"]),
  brandId: z.string().max(120).optional(),
  categoryIds: z.array(z.string().min(1)).min(1).max(20),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  featured: z.boolean(),
  price: z.number().finite().min(0).max(1_000_000_000),
  priceOnRequest: z.boolean(),
  sku: z.string().trim().max(120),
  variants: z.array(z.object({
    id: z.string().max(160).optional(),
    name: z.string().trim().min(1).max(180),
    sku: z.string().trim().max(120),
    price: z.number().finite().min(0).max(1_000_000_000),
    priceOnRequest: z.boolean(),
    currency: z.string().trim().length(3),
    inventory: z.object({
      quantity: z.number().int().min(0).max(1_000_000_000),
      trackInventory: z.boolean(),
      allowBackorder: z.boolean(),
    }),
    options: z.array(z.object({ name: z.string().trim().min(1).max(120), value: z.string().trim().max(180) })).max(30),
    images: z.array(z.object({
      url: z.string().min(1).max(2048),
      alt: z.string().max(240),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })).max(30),
  })).min(1).max(100).optional(),
  images: z.array(z.object({
    url: z.string().min(1).max(2048),
    alt: z.string().max(240),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })).max(30),
})

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: catalogSlug,
  description: z.string().trim().max(5000),
  parentId: z.string().max(120).default(""),
  order: z.number().int().min(0).max(100000),
  image: z.object({
    url: z.string().min(1).max(2048),
    alt: z.string().max(240),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }).nullable(),
})

export type ProductInput = z.infer<typeof productInputSchema>
export type CategoryInput = z.infer<typeof categoryInputSchema>
