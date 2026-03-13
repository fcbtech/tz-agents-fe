import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import { useAuthStore } from '@/lib/store/auth-store'
import { getValidToken, refreshAccessToken } from './auth'

const AUTH_URL = import.meta.env.VITE_AUTH_URL as string

export const authClient = axios.create({
  baseURL: AUTH_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true
      try {
        const newToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)
