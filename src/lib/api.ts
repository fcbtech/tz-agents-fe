import { useAuthStore } from '@/stores/auth-store'
import { API_BASE_URL } from './constants'
import { getValidToken, refreshAccessToken } from './token-refresh'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getValidToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options?.headers,
      },
    })
    if (!retryResponse.ok) {
      useAuthStore.getState().logout()
      throw new Error(`API error: ${retryResponse.status}`)
    }
    return retryResponse.json() as Promise<T>
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}
