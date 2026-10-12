import type { Product, ProductVariant } from "@/types"

export function isPriceOnRequest(variant: Pick<ProductVariant, "price" | "priceOnRequest">) {
  return variant.priceOnRequest === true || !Number.isFinite(variant.price) || variant.price <= 0
}

export function getProductMaterial(product: Product, variant = product.variants[0]) {
  // Only use an explicit characteristic; tags also contain categories and service labels.
  return variant?.options.find((option) => /^материал(?:ы| каркаса)?$/i.test(option.name.trim()))?.value
}

export function getAvailability(variant: ProductVariant) {
  if (variant.inventory.quantity > 0) return "В наличии"
  if (variant.inventory.allowBackorder) return "Под заказ"
  return "Уточнить наличие"
}

export function productCountLabel(count: number) {
  const form = new Intl.PluralRules("ru").select(count)
  return `${new Intl.NumberFormat("ru-RU").format(count)} ${form === "one" ? "товар" : form === "few" ? "товара" : "товаров"}`
}
