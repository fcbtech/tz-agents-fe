import { apiClient } from '@/lib/api/axios'
import type { SessionDetail, SessionListResponse } from '@/lib/types/session'

const SESSIONS_API = '/api/sessions'

export async function fetchSessions(
  limit = 50,
  offset = 0,
): Promise<SessionListResponse> {
  const res = await apiClient.get<SessionListResponse>(SESSIONS_API, {
    params: { limit, offset },
  })
  return res.data
}

export async function fetchSessionDetail(
  sessionId: string,
): Promise<SessionDetail> {
  const res = await apiClient.get<SessionDetail>(
    `${SESSIONS_API}/${encodeURIComponent(sessionId)}`,
  )
  return res.data
}
