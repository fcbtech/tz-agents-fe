import { useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'

import { useSessionDetail } from '@/lib/hooks/useSessions'
import { useChatStore } from '@/lib/store/chat-store'
import {
  mapStoredMessagesToChat,
  poDraftFromApi,
} from '@/lib/utils/session-messages'

/**
 * Loads session detail from API into the chat store when a sessionId is
 * present in the URL. Store reset on navigation is handled by the route's
 * `beforeLoad`; error redirect is handled declaratively via `<Navigate>`.
 *
 * Returns query state so the route component can render `<Navigate>` on error.
 */
export function useSessionNavigation() {
  const { sessionId } = useSearch({ from: '/' })
  const query = useSessionDetail(sessionId ?? null)
  const loadSession = useChatStore((s) => s.loadSession)

  useEffect(() => {
    if (!sessionId || !query.isSuccess) return
    loadSession(
      sessionId,
      mapStoredMessagesToChat(query.data.messages),
      poDraftFromApi(query.data.po_draft),
    )
  }, [sessionId, query.isSuccess, query.data, loadSession])

  return { sessionId, isError: query.isError }
}
