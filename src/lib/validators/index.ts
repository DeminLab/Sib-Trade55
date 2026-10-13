import { z } from "zod"

// --- Address ---

export const addressSchema = z.object({
firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  line1: z.string().min(1, "Адрес обязателен"),
  line2: z.string().optional(),
  city: z.string().min(1, "Город обязателен"),
  state: z.string().min(1, "Область обязательна"),
  postalCode: z.string().min(1, "Индекс обязателен"),
  country: z.string().min(1, "Страна обязательна"),
  phone: z.string().optional(),
})

// --- Auth ---

export const loginSchema = z.object({
email: z.string().trim().email("Неверный email").max(320),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов").max(1024),
})

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "Имя обязательно"),
    lastName: z.string().min(1, "Фамилия обязательна"),
    email: z.string().email("Неверный email"),
    password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email("Неверный email"),
})

// --- Checkout ---

export const checkoutFormSchema = z.object({
  email: z.string().email("Неверный email"),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: z.boolean().default(true),
})

// --- Contact ---

export const contactFormSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Неверный email"),
  subject: z.string().min(1, "Тема обязательна"),
  message: z.string().min(10, "Сообщение должно содержать минимум 10 символов"),
  preferredContact: z.enum(["phone", "email", "whatsapp", "telegram"]),
})

// --- Newsletter ---

export const newsletterSchema = z.object({
  email: z.string().email("Неверный email"),
})

// --- Type exports ---

export type AddressFormData = z.infer<typeof addressSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type NewsletterFormData = z.infer<typeof newsletterSchema>
