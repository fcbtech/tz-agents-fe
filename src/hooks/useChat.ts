import { useChatStore } from '@/stores/chat-store'
import { streamSSE } from '@/lib/sse'
import type { Mention } from '@/types/chat'

export function useChat() {
  const store = useChatStore()

  const sendMessage = async (text: string, mentions: Mention[] = []) => {
    store.addUserMessage(text, mentions)
    store.setStreaming(true)
    store.setError(null)

    try {
      for await (const event of streamSSE('/api/chat', {
        session_id: store.sessionId ?? '',
        message: text,
        mentions,
        action: 'message',
      })) {
        const data = JSON.parse(event.data)

        switch (event.event) {
          case 'session':
            store.setSessionId(data.session_id)
            break
          case 'token':
            store.appendStreamingContent(data.content)
            break
          case 'clarification':
            // Finalize any pending streaming text first
            store.finalizeStreaming()
            store.addAssistantMessage({ clarification: data })
            break
          case 'draft_update':
            // Progressive PO draft update → updates the right-side panel
            store.updatePODraft(data)
            break
          case 'preview':
            // Final preview — all required fields filled, PO is ready to submit
            store.updatePODraft(data)
            store.setPOReady(true)
            break
          case 'submit_result':
            store.finalizeStreaming()
            store.addAssistantMessage({ submitResult: data })
            store.setPOSubmitted(data.success)
            break
          case 'error':
            store.setError(data.message)
            break
          case 'done':
            store.finalizeStreaming()
            break
        }
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      store.setStreaming(false)
    }
  }

  const respondToClarification = async (
    messageId: string,
    field: string,
    value: string,
  ) => {
    store.markClarificationAnswered(messageId, value)
    await sendMessage(`Selected ${value} for ${field}`)
  }

  const figureItOut = async (messageId: string, field: string) => {
    store.markClarificationAnswered(messageId, 'figure_it_out')
    await sendMessage(`Figure it out for ${field}`)
  }

  const confirmPreview = async () => {
    await sendMessage('Confirmed. Please submit the PO.')
  }

  return {
    ...store,
    sendMessage,
    respondToClarification,
    figureItOut,
    confirmPreview,
  }
}
