import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"

const stats = [
  { name: "Общая выручка", value: "12 345 $", icon: DollarSign },
  { name: "Заказы", value: "156", icon: ShoppingCart },
  { name: "Товары", value: "48", icon: Package },
  { name: "Клиенты", value: "2 340", icon: Users },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader title="Панель управления" description="Обзор показателей магазина." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Заказов пока нет. Они появятся здесь после первых покупок.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
