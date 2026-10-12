import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

const text = z.string().trim().max(5000)
const name = z.string().trim().min(2).max(240)
const slug = z.string().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const image = z.object({ url: z.string().max(2048).refine(v => v === '' || /^\/(?:api\/catalog\/media\/|images\/)[^\s<>]*$/.test(v), 'Загрузите изображение сайта'), alt: z.string().max(240), width: z.number().positive().optional(), height: z.number().positive().optional() })
const strings = z.array(text).max(100)
const pairs = z.array(z.object({ label: name, value: text })).max(100)
const html = z.string().max(100000).transform(value => sanitizeHtml(value, { allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'], allowedAttributes: { a: ['href', 'title'] }, allowedSchemes: ['http', 'https', 'mailto', 'tel'] }))
const common = { id: z.string().max(160), title: name, slug, excerpt: text.optional(), body: html, publishedAt: z.string().refine(v => Number.isFinite(Date.parse(v)), 'Укажите дату публикации') }
export const contentSchemas = {
  pages: z.object(common),
  blog: z.object({ ...common, excerpt: text, author: name, tags: strings, coverImage: image.optional() }),
  cases: z.object({ ...common, body: z.string().optional(), excerpt: text, description: text, task: text, solution: text, result: text, city: name, year: z.number().int().min(1900).max(2200), category: name, categorySlug: slug, coverImage: image, gallery: z.array(image).max(50), materials: strings, characteristics: pairs, productionStages: z.array(z.object({ title: name, description: text })).max(50), featured: z.boolean() }),
  materials: z.object({ id: z.string().max(160), name, slug, kind: z.literal('material'), summary: text, properties: strings, applications: strings, advantages: strings, limitations: strings, technicalData: pairs }),
  coatings: z.object({ id: z.string().max(160), name, slug, kind: z.literal('coating'), summary: text, properties: strings, applications: strings, advantages: strings, limitations: strings, technicalData: pairs }),
  ralColors: z.object({ code: name, name, hex: z.string().regex(/^#[0-9a-f]{6}$/i), group: name }),
}
