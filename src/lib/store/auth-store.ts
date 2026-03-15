import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userEmail: string | null
  isAuthenticated: boolean
  setTokens: (
    accessToken: string,
    refreshToken: string,
    email?: string,
  ) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        userEmail: null,
        isAuthenticated: false,
        setTokens: (accessToken, refreshToken, email) =>
          set((state) => ({
            accessToken,
            refreshToken,
            userEmail: email ?? state.userEmail,
            isAuthenticated: true,
          })),
        logout: () =>
          set({
            accessToken: null,
            refreshToken: null,
            userEmail: null,
            isAuthenticated: false,
          }),
      }),
      { name: 'tz-auth' },
    ),
    { name: 'auth-store', enabled: true },
  ),
)
