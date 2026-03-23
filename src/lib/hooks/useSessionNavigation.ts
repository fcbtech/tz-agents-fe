import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { useSessionDetail } from '@/lib/hooks/useSessions'
import { useChatStore } from '@/lib/store/chat-store'
import {
  mapStoredMessagesToChat,
  poDraftFromApi,
} from '@/lib/utils/session-messages'

/**
 * Syncs URL `sessionId` search param with chat store: new chat clears store;
 * existing id loads detail from API in one atomic loadSession.
 */
export function useSessionNavigation() {
  const navigate = useNavigate({ from: '/' })
  const { sessionId } = useSearch({ from: '/' })
  const { data, isSuccess, isError } = useSessionDetail(sessionId ?? null)
  const reset = useChatStore((s) => s.reset)
  const loadSession = useChatStore((s) => s.loadSession)

  useEffect(() => {
    if (!sessionId) {
      reset()
      return
    }
    const s = useChatStore.getState()
    if (s.sessionId !== sessionId) {
      useChatStore.setState({
        sessionId,
        messages: [],
        streamingContent: '',
        error: null,
        isStreaming: false,
        poDraft: null,
        poReady: false,
        poSubmitted: false,
      })
    }
  }, [sessionId, reset])

  useEffect(() => {
    if (!sessionId || !isSuccess) return
    loadSession(
      sessionId,
      mapStoredMessagesToChat(data.messages),
      poDraftFromApi(data.po_draft),
    )
  }, [sessionId, isSuccess, data, loadSession])

  useEffect(() => {
    if (!sessionId || !isError) return
    navigate({ to: '/', search: {} })
  }, [sessionId, isError, navigate])
}
