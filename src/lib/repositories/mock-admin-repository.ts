import type {
  AdminDashboardSnapshot,
  AdminRepository,
  AdminLowStockProduct,
  AdminPopularProduct,
} from "@/types"
import productsData from "@/data/products.json"
import type { Product } from "@/types"

const products = productsData.products as Product[]
const categories = new Map(productsData.categories.map((category) => [category.id, category.name]))

const popularProducts: AdminPopularProduct[] = products
  .filter((product) => product.status === "active")
  .slice(0, 5)
  .map((product, index) => ({
    productId: product.id,
    name: product.name,
    category: categories.get(product.categoryIds[0]) ?? "Без категории",
    unitsSold: [324, 280, 265, 198, 176][index] ?? 0,
    revenue: [1296000, 840000, 795000, 594000, 1584000][index] ?? 0,
  }))

const lowStockProducts: AdminLowStockProduct[] = products
  .filter((product) => product.status === "active")
  .slice(5, 10)
  .map((product, index) => ({
    productId: product.id,
    name: product.name,
    stock: [6, 8, 12, 15, 4][index] ?? 0,
    minimum: [20, 50, 100, 100, 10][index] ?? 10,
    status: index === 4 ? "out" : "low",
  }))

const dashboard: AdminDashboardSnapshot = {
  metrics: [
    { id: "revenue", label: "Выручка", value: "12 460 000 ₽", change: "+12%", trend: "up" },
    { id: "orders", label: "Заказы", value: "142", change: "+8%", trend: "up" },
    { id: "requests", label: "Новые заявки", value: "27", change: "+35%", trend: "up" },
    { id: "quotes", label: "Запросы КП", value: "18", change: "+20%", trend: "up" },
  ],
  popularProducts,
  lowStockProducts,
  recentOrders: [
    { orderNumber: "ST-2024-0314", date: "31.03.2024", customer: "ООО «ПромТехМонтаж»", itemCount: 12, total: 486000, status: "processing", manager: "Иван Алексеев" },
    { orderNumber: "ST-2024-0313", date: "30.03.2024", customer: "АО «СеверСтрой»", itemCount: 8, total: 320000, status: "delivered", manager: "Елена Кузнецова" },
    { orderNumber: "ST-2024-0312", date: "29.03.2024", customer: "ООО «ТехноПром»", itemCount: 15, total: 912000, status: "shipped", manager: "Дмитрий Волков" },
    { orderNumber: "ST-2024-0311", date: "28.03.2024", customer: "АО «УралЭнерго»", itemCount: 6, total: 275000, status: "processing", manager: "Ольга Смирнова" },
    { orderNumber: "ST-2024-0310", date: "28.03.2024", customer: "ООО «МеталлКомплект»", itemCount: 20, total: 1240000, status: "delivered", manager: "Иван Алексеев" },
  ],
}

export const mockAdminRepository: AdminRepository = {
  async getDashboard() {
    return dashboard
  },
}

export function getAdminInventory(): { popularProducts: AdminPopularProduct[]; lowStockProducts: AdminLowStockProduct[] } {
  return { popularProducts, lowStockProducts }
}
