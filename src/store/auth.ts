"use client"

import { create } from "zustand"
import type { Address, User } from "@/types"
import { authService } from "@/lib/services"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<Pick<User, "firstName" | "lastName" | "email">>) => Promise<boolean>
  addAddress: (address: Omit<Address, "id">) => Promise<boolean>
  removeAddress: (id: string) => Promise<boolean>
}

/**
 * Client session state only. Identity, credentials and persistence belong to
 * the backend auth adapter; no users or passwords are bundled in the app.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    try {
      const session = await authService.login(email, password)
      set({ user: session.user, isAuthenticated: true })
      return true
    } catch {
      return false
    }
  },

  register: async (data) => {
    try {
      const session = await authService.register(data)
      set({ user: session.user, isAuthenticated: true })
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    void authService.logout().catch(() => undefined)
    set({ user: null, isAuthenticated: false })
  },

  updateProfile: async (data) => {
    try {
      const user = await authService.updateProfile(data)
      set({ user, isAuthenticated: true })
      return true
    } catch {
      return false
    }
  },

  addAddress: async (address) => {
    try {
      const savedAddress = await authService.addAddress(address)
      set((state) => state.user ? { user: { ...state.user, addresses: [...state.user.addresses, savedAddress] } } : state)
      return true
    } catch {
      return false
    }
  },

  removeAddress: async (id) => {
    try {
      await authService.removeAddress(id)
      set((state) => state.user ? { user: { ...state.user, addresses: state.user.addresses.filter((address) => address.id !== id) } } : state)
      return true
    } catch {
      return false
    }
  },
}))
