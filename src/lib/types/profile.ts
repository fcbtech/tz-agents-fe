export interface UserProfile {
  user_id: number
  user_uuid: string
  name: string
  email: string
  avatar_url: string | null
  mobile: string | null
}

export interface CompanyProfile {
  company_id: number
  company_uuid: string
  name: string
  logo_url: string | null
}

export interface ProfileResponse {
  user: UserProfile
  company: CompanyProfile
}
