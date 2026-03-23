import type { ChatMessage } from '@/lib/types/chat'
import type { StoredMessage } from '@/lib/types/session'

export function mapStoredMessagesToChat(
  messages: StoredMessage[],
): ChatMessage[] {
  return messages.map((message, i) => {
    const timestamp = Date.parse(message.timestamp)
    return { ...message, id: `hist-${i}-${timestamp}`, timestamp }
  })
}
