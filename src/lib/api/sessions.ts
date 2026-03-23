import { apiClient } from '@/lib/api/axios'
import type { SessionDetail, SessionListResponse } from '@/lib/types/session'

export async function fetchSessions(
  limit = 50,
  offset = 0,
): Promise<SessionListResponse> {
  const res = await apiClient.get<SessionListResponse>('/api/sessions', {
    params: { limit, offset },
  })
  return res.data
}

export async function fetchSessionDetail(
  sessionId: string,
): Promise<SessionDetail> {
  const res = await apiClient.get<SessionDetail>(
    `/api/sessions/${encodeURIComponent(sessionId)}`,
  )
  return res.data
}
