import { Boxes } from "lucide-react"
import { AdminSectionPage } from "@/components/admin/admin-section-page"
import { productRepository } from "@/lib/repositories"

export default async function AdminProductsPage() {
  const result = await productRepository.list(undefined, undefined, { page: 1, limit: 12 })
  return <AdminSectionPage eyebrow="Каталог / управление" title="Товары" description="Каталог готовых изделий и товарных позиций. Здесь позже появятся редактирование, остатки и синхронизация с API." icon={Boxes} rows={result.items.slice(0, 8).map((product) => ({ id: product.id, title: product.name, meta: product.variants[0]?.sku ?? "Без SKU", value: product.variants[0]?.inventory.quantity ? `${product.variants[0].inventory.quantity} шт.` : "Под заказ", status: product.status === "active" ? "Опубликован" : "Черновик" }))} />
}
