import type { ChatMessage } from '@/lib/types/chat'
import type { PODraft } from '@/lib/types/documents'
import type { StoredMessage } from '@/lib/types/session'

export function mapStoredMessagesToChat(raw: StoredMessage[]): ChatMessage[] {
  const list = Array.isArray(raw) ? raw : []
  return list.map((m, i) => {
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const timestamp = Date.parse(m.timestamp) || Date.now()
    return {
      id: `hist-${i}-${timestamp}`,
      role,
      content: m.content,
      timestamp,
    }
  })
}

export function poDraftFromApi(raw: Record<string, unknown> | null): PODraft | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as unknown as PODraft
}
