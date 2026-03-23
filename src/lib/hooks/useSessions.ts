import { useQuery } from '@tanstack/react-query'

import { fetchSessionDetail, fetchSessions } from '@/lib/api/sessions'
import { useAuthStore } from '@/lib/store/auth-store'

export function useSessionList() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useSessionDetail(sessionId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSessionDetail(sessionId!),
    enabled: isAuthenticated && !!sessionId,
    staleTime: 5 * 60 * 1000,
  })
}
