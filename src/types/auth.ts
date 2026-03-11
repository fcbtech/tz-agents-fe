export interface AuthResponse {
  status: number
  data: {
    refresh_token: string
    access_token: string
    onboarding_status: boolean
    require_2fa: boolean
    masked_mobile_number: string | null
    masked_email: string | null
  }
  message: string
  anonymous: number
}

export interface LoginPayload {
  email: string
  password: string
}
