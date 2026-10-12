import type { AdminDashboardSnapshot, AdminRepository } from "@/types"
import { readCatalog } from "@/lib/catalog/catalog-store"

export const catalogAdminRepository: AdminRepository = {
  async getDashboard(): Promise<AdminDashboardSnapshot> {
    const { products, categories } = await readCatalog()
    const active = products.filter((product) => product.status === "active")
    const drafts = products.filter((product) => product.status === "draft")
    const archived = products.filter((product) => product.status === "archived")
    const outOfStock = active.filter((product) =>
      product.variants.length > 0 && product.variants.every((variant) =>
        variant.inventory.trackInventory && variant.inventory.quantity <= 0 && !variant.inventory.allowBackorder
      )
    )
    const recentProducts = [...products]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        name: product.name,
        status: product.status,
        updatedAt: product.updatedAt,
        variants: product.variants.length,
        price: product.variants[0]?.price ?? null,
        priceOnRequest: product.variants[0]?.priceOnRequest ?? false,
      }))

    return {
      metrics: [
        { id: "products", label: "Всего товаров", value: String(products.length) },
        { id: "active", label: "Опубликовано", value: String(active.length) },
        { id: "drafts", label: "Черновики", value: String(drafts.length) },
        { id: "archived", label: "В архиве", value: String(archived.length) },
      ],
      catalog: {
        categoryCount: categories.length,
        outOfStockCount: outOfStock.length,
        recentProducts,
      },
    }
  },
}
