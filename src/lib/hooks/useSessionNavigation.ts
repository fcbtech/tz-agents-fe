import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

import { useSessionDetail } from '@/lib/hooks/useSessions'
import { useChatStore } from '@/lib/store/chat-store'
import { mapStoredMessagesToChat } from '@/lib/utils/session-messages'

/**
 * Loads session detail from API into the chat store when a sessionId is
 * present in the URL. Store reset on navigation is handled by the route's
 * `beforeLoad`; error redirect is handled declaratively via `<Navigate>`.
 *
 * Returns query state so the route component can render `<Navigate>` on error.
 */
export function useSessionNavigation() {
  const sessionId = useLocation({
    select: (location) => {
      const sessionId = new URLSearchParams(location.searchStr).get('sessionId')
      return sessionId && sessionId.length > 0 ? sessionId : undefined
    },
  })
  const query = useSessionDetail(sessionId ?? null)
  const loadSession = useChatStore((s) => s.loadSession)

  useEffect(() => {
    if (!sessionId || !query.isSuccess) return
    loadSession(
      sessionId,
      mapStoredMessagesToChat(query.data.messages),
      query.data.po_draft,
    )
  }, [sessionId, query.isSuccess, query.data, loadSession])

  return { sessionId, isError: query.isError }
}
