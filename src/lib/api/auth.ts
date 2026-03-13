import { authClient } from './axios'
import { useAuthStore } from '@/lib/store/auth-store'
import type { AuthResponse, LoginPayload } from '@/lib/types/auth'

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await authClient.post<AuthResponse>(
    '/main/login/password-login/',
    payload,
  )
  return data
}

interface RefreshTokenResponse {
  refresh_token: string
  access_token: string
}

let refreshPromise: Promise<string> | null = null

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const { refreshToken, setTokens, logout } = useAuthStore.getState()

    if (!refreshToken) {
      logout()
      throw new Error('No refresh token available')
    }

    try {
      const { data } = await authClient.post<RefreshTokenResponse>(
        '/main/login/api-token-refresh/',
        { refresh_token: refreshToken },
      )

      if (!data.access_token) {
        throw new Error('Failed to refresh token')
      }

      setTokens(data.access_token, data.refresh_token)
      return data.access_token
    } catch {
      logout()
      throw new Error('Token refresh failed')
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function getValidToken(): Promise<string | null> {
  const { accessToken } = useAuthStore.getState()
  if (!accessToken) return null

  if (isTokenExpiringSoon(accessToken, 60)) {
    return refreshAccessToken()
  }

  return accessToken
}

function isTokenExpiringSoon(token: string, thresholdSeconds: number): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp as number
    return Date.now() >= (exp - thresholdSeconds) * 1000
  } catch {
    return false
  }
}
