import type { AdminDashboardSnapshot, AdminRepository } from "@/types"

export const apiAdminRepository: AdminRepository = {
  async getDashboard(): Promise<AdminDashboardSnapshot> {
    // The server adapter is intentionally unconfigured until a real admin API
    // is supplied. Keep this boundary so the page never fabricates metrics.
    throw new Error("Данные dashboard недоступны: backend-сервис не подключён")
  },
}
