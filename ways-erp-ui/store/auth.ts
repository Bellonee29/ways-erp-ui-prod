import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, UserRole } from '@/types'

interface AuthUser {
  token: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  organizationName: string
  mustChangePassword: boolean
  tenantId?: string
  divisionId?: string
}

interface AuthStore {
  user: AuthUser | null
  pendingEmail: string | null
  _hasHydrated: boolean
  setUser: (user: AuthUser) => void
  setPendingEmail: (email: string) => void
  setHasHydrated: (value: boolean) => void
  logout: () => void
  isTenantAdmin: () => boolean
  isDivisionAdmin: () => boolean
  isTenantUser: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      pendingEmail: null,
      _hasHydrated: false,

      setUser: (user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ways_erp_token', user.token)
        }
        set({ user, pendingEmail: null })
      },

      setPendingEmail: (email) => set({ pendingEmail: email }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ways_erp_token')
        }
        set({ user: null, pendingEmail: null })
      },

      isTenantAdmin: () => get().user?.role === 'TENANT_ADMIN',
      isDivisionAdmin: () => get().user?.role === 'DIVISION_ADMIN',
      isTenantUser: () => get().user?.role === 'TENANT_USER',
    }),
    {
      name: 'ways_erp_user',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

/** Helper to build an AuthUser from the API response */
export function mapAuthResponse(res: AuthResponse): AuthUser {
  return {
    token: res.token,
    email: res.email,
    role: res.role as UserRole,
    firstName: res.firstName ?? '',
    lastName: res.lastName ?? '',
    organizationName: res.organizationName ?? '',
    mustChangePassword: res.requiresPasswordChange,
    tenantId: res.tenantId,
  }
}