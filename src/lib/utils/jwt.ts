import { jwtDecode } from 'jwt-decode'

interface JWTClaims {
  user_id: number
  company_id: number
  user_uuid: string
  company_uuid: string
}

export function decodeJWTClaims(token: string): JWTClaims {
  const payload = jwtDecode<JWTClaims>(token)
  return {
    user_id: payload.user_id,
    company_id: payload.company_id,
    user_uuid: payload.user_uuid,
    company_uuid: payload.company_uuid,
  }
}
