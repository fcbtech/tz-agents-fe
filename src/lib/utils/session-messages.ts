import type { ChatMessage } from '@/lib/types/chat'
import type { PODraft } from '@/lib/types/documents'
import type { StoredMessage } from '@/lib/types/session'

export function mapStoredMessagesToChat(raw: StoredMessage[]): ChatMessage[] {
  return raw.map((m, i) => {
    const timestamp = Date.parse(m.timestamp) || Date.now()
    return {
      id: `hist-${i}-${timestamp}`,
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
      timestamp,
    }
  })
}

export function poDraftFromApi(raw: Record<string, unknown> | null): PODraft | null {
  return (raw ?? null) as PODraft | null
}
