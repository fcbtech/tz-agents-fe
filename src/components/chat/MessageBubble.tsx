import Markdown from 'react-markdown'
import { Card, CardContent } from '@/components/ui/card'
import type { ChatMessage } from '@/types/chat'
import MentionChip from './MentionChip'

interface Props {
  message: ChatMessage
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser ? (
        <Card className="max-w-[80%] rounded-2xl py-0 gap-0 bg-blue-600 text-white border-blue-600">
          <CardContent className="px-4 py-3">
            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.mentions && message.mentions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.mentions.map((mention) => (
                  <MentionChip key={mention.id} mention={mention} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-[80%] py-0 gap-0">
          <CardContent className="px-4 py-3 prose prose-sm max-w-none">
            <Markdown>{message.content}</Markdown>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
