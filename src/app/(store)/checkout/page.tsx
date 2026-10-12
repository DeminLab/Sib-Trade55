"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/store/cart"
import { CartSummary } from "@/components/cart/cart-summary"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { orderService } from "@/lib/services"
import { useSiteSettings } from '@/components/layout/site-settings-provider'
const subscribeToHydration = () => () => {}

export default function CheckoutPage() {
  const siteConfig = useSiteSettings()
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "RU",
  })


  if (!mounted) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Оформление заказа</h1>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Оформление заказа</h1>
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Ваша корзина пуста. Добавьте товары перед оформлением.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/shop">Продолжить покупки</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.email || !form.firstName || !form.lastName || !form.line1 || !form.city || !form.state || !form.postalCode) {
      toast.error("Заполните все обязательные поля")
      return
    }

    setLoading(true)

    const shipping = 0
    const tax = 0
    const total = subtotal + shipping + tax
    try {
      const order = await orderService.create({
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        variantName: item.variantName,
        sku: "",
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        total: item.lineTotal,
      })),
      subtotal,
      tax,
      shipping,
      total,
      currency: "RUB",
      shippingAddress: {
        id: "addr-1",
        type: "shipping",
        firstName: form.firstName,
        lastName: form.lastName,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        phone: form.phone || undefined,
        isDefault: true,
      },
      customerEmail: form.email,
      customerName: `${form.firstName} ${form.lastName}`,
      customerPhone: form.phone || undefined,
      })
      clearCart()
      sessionStorage.setItem('last-order-receipt', order.orderNumber)
      toast.success("Заявка отправлена")
      router.push(`/checkout/success?order_number=${encodeURIComponent(order.orderNumber)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Оформление заказа временно недоступно")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Оформление заказа</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="space-y-8 lg:col-span-3">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Контактные данные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон для связи</Label>
                <Input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} placeholder={siteConfig.contact.phone} />
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Адрес доставки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 min-[480px]:grid-cols-2">
                <div className="space-y-2">
<Label htmlFor="firstName">Имя</Label>
                  <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="line1">Адрес</Label>
                <Input id="line1" name="line1" value={form.line1} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line2">Квартира (необязательно)</Label>
                <Input id="line2" name="line2" value={form.line2} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
<Label htmlFor="city">Город</Label>
                  <Input id="city" name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Область</Label>
                  <Input id="state" name="state" value={form.state} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Индекс</Label>
                  <Input id="postalCode" name="postalCode" value={form.postalCode} onChange={handleChange} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment boundary */}
          <Card>
            <CardHeader>
<CardTitle className="text-lg">Оплата</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Это заявка на заказ: мы получим её в панели администратора и свяжемся с вами для подтверждения наличия, доставки и итоговой стоимости. Оплата на сайте не производится.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-lg">Состав заявки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} &times; {item.quantity}
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
              <Separator />
              <CartSummary subtotal={subtotal} />
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Отправляем..." : "Отправить заявку"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
