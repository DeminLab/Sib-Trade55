import type { AuthorizationService } from "@/types"

export const permissions = {
  catalogRead: "catalog:read",
  catalogWrite: "catalog:write",
  ordersRead: "orders:read",
  ordersManage: "orders:manage",
  quotesRead: "quotes:read",
  quotesManage: "quotes:manage",
  customersRead: "customers:read",
  contentManage: "content:manage",
  filesWrite: "files:write",
} as const

export const authorizationService: AuthorizationService = {
  can(context, permission) {
    return context.permissions.includes(permission)
  },
  require(context, permission) {
    if (!context.permissions.includes(permission)) {
      throw new Error(`Missing permission: ${permission}`)
    }
  },
}
