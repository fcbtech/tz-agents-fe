import { useEffect, useMemo, useRef } from 'react'
import type { ChatMessage } from '@/types/chat'
import MessageBubble from './MessageBubble'
import ClarificationCard from './ClarificationCard'
import SubmitResultCard from './SubmitResultCard'
import TypingIndicator from './TypingIndicator'

interface Props {
  messages: ChatMessage[]
  streamingContent: string
  isStreaming: boolean
  onClarificationSelect: (
    messageId: string,
    field: string,
    value: string,
  ) => void
  onFigureItOut: (messageId: string, field: string) => void
}

export default function MessageList({
  messages,
  streamingContent,
  isStreaming,
  onClarificationSelect,
  onFigureItOut,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const streamingMessage = useMemo(
    () =>
      streamingContent
        ? ({
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
            timestamp: Date.now(),
          } as ChatMessage)
        : null,
    [streamingContent],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {messages.map((msg) => {
        if (msg.clarification) {
          return (
            <ClarificationCard
              key={msg.id}
              message={msg}
              onSelect={(field, value) =>
                onClarificationSelect(msg.id, field, value)
              }
              onFigureItOut={(field) => onFigureItOut(msg.id, field)}
            />
          )
        }
        if (msg.submitResult) {
          return <SubmitResultCard key={msg.id} result={msg.submitResult} />
        }
        return <MessageBubble key={msg.id} message={msg} />
      })}

      {/* Streaming text (not yet finalized) */}
      {streamingMessage && <MessageBubble message={streamingMessage} />}

      {isStreaming && !streamingContent && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}
