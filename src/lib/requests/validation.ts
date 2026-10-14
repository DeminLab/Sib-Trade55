import { z } from "zod"

const requiredText = (label: string, max = 200) => z.string().trim().min(1, `${label}: заполните поле`).max(max)
const optionalText = (max = 200) => z.string().trim().max(max).default("")
const email = z.string().trim().email("Укажите корректный email").max(254)
const phone = z.string().trim().max(40).refine((value) => value.replace(/\D/g, "").length >= 7, "Укажите корректный телефон")
const preferredContact = z.enum(["phone", "email", "whatsapp", "telegram"])

export const contactRequestSchema = z.object({
  name: requiredText("Имя"),
  company: optionalText(),
  phone: optionalText(40),
  email: z.union([email, z.literal("")]),
  subject: requiredText("Тема"),
  message: z.string().trim().min(10, "Сообщение должно содержать минимум 10 символов").max(10000),
  preferredContact,
}).refine((data) => data.subject === "Заказать звонок" || email.safeParse(data.email).success, {
  message: "Укажите корректный email", path: ["email"],
}).refine((data) => !(data.subject === "Заказать звонок" || ["phone", "whatsapp"].includes(data.preferredContact)) || phone.safeParse(data.phone).success, {
  message: "Укажите телефон для выбранного способа связи", path: ["phone"],
})

export const quoteRequestSchema = z.object({
  company: optionalText(),
  inn: optionalText(12).refine((value) => !value || /^\d{10}(\d{2})?$/.test(value), "ИНН должен содержать 10 или 12 цифр"),
  contactName: requiredText("Контактное лицо"),
  phone,
  email: z.union([email, z.literal("")]).default(""),
  comment: optionalText(10000),
  desiredTerm: optionalText(),
  preferredContact,
  items: z.array(z.object({
    id: requiredText("Позиция"),
    productId: requiredText("Товар"),
    variantId: requiredText("Вариант"),
    name: requiredText("Название товара", 500),
    variantName: optionalText(500),
    image: z.object({ url: z.string().max(2048), alt: z.string().max(500) }),
    slug: requiredText("Адрес товара", 500),
    price: z.number().finite().nonnegative(),
    priceOnRequest: z.boolean().optional(),
    quantity: z.number().int().positive().max(10000),
    lineTotal: z.number().finite().nonnegative(),
    currency: z.literal("RUB"),
  })).min(1, "Добавьте хотя бы один товар").max(100),
}).refine((data) => data.preferredContact !== "email" || email.safeParse(data.email).success, {
  message: "Укажите email для ответа по почте", path: ["email"],
}).transform((data) => ({ ...data, items: data.items.map((item) => ({ ...item, price: 0, lineTotal: 0, priceOnRequest: true })) }))

export const customRequestSchema = z.object({
  name: requiredText("Имя"), phone, email,
  productType: requiredText("Тип изделия"),
  dimensions: optionalText(500), material: optionalText(), finish: optionalText(),
  quantity: z.string().trim().regex(/^\d+$/, "Количество должно быть целым числом").refine((value) => Number(value) > 0 && Number(value) <= 10000, "Количество: от 1 до 10000"),
  comment: optionalText(10000),
})

export const requestStatusSchema = z.enum(["submitted", "processing", "completed", "cancelled"])
export const requestKindSchema = z.enum(["contact", "quote", "custom"])
export const maxAttachmentSize = 10 * 1024 * 1024
export const maxAttachmentCount = 5
export const attachmentExtensions = /\.(pdf|jpe?g|png|dwg|dxf)$/i
