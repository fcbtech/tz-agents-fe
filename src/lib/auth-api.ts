import { authClient } from '@/lib/axios'
import type { AuthResponse, LoginPayload } from '@/types/auth'

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await authClient.post<AuthResponse>(
    '/main/login/password-login/',
    payload,
  )
  return data
}
