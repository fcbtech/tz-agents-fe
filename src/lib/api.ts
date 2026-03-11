import { useAuthStore } from '@/stores/auth-store'
import { API_BASE_URL } from './constants'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}
