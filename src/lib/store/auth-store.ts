import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { decodeJWTClaims } from '@/lib/utils/jwt'

interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  userEmail: string | null
  userId: number | null
  companyId: number | null
  isAuthenticated: boolean
  setTokens: (accessToken: string, refreshToken: string, email?: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        userEmail: null,
        userId: null,
        companyId: null,
        isAuthenticated: false,
        setTokens: (accessToken, refreshToken, email) => {
          let userId: number | null = null
          let companyId: number | null = null
          try {
            const claims = decodeJWTClaims(accessToken)
            userId = claims.user_id
            companyId = claims.company_id
          } catch {
            // JWT decode failed — store tokens anyway, IDs will be null
          }
          set((state) => ({
            accessToken,
            refreshToken,
            userEmail: email ?? state.userEmail,
            userId,
            companyId,
            isAuthenticated: true,
          }))
        },
        logout: () =>
          set({
            accessToken: null,
            refreshToken: null,
            userEmail: null,
            userId: null,
            companyId: null,
            isAuthenticated: false,
          }),
      }),
      { name: 'tz-auth' },
    ),
    { name: 'auth-store', enabled: true },
  ),
)
