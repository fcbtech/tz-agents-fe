import { useChat } from '@/hooks/useChat'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import MessageList from './MessageList'
import POPreviewPanel from './POPreviewPanel'
import ChatInput from '../input/ChatInput'

export default function ChatContainer() {
  const chat = useChat()
  const showPanel = chat.poDraft !== null

  return (
    <div className="flex h-screen bg-white">
      {/* Left: Chat area */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          showPanel ? 'w-1/2 lg:w-3/5' : 'w-full'
        }`}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={chat.messages}
            streamingContent={chat.streamingContent}
            isStreaming={chat.isStreaming}
            onClarificationSelect={chat.respondToClarification}
            onFigureItOut={chat.figureItOut}
          />
        </div>

        {/* Input */}
        <Card className="rounded-none border-0 shadow-none py-0 gap-0">
          <CardContent className="p-4">
            <ChatInput onSend={chat.sendMessage} disabled={chat.isStreaming} />
          </CardContent>
        </Card>

        {/* Error display */}
        {chat.error && (
          <Alert
            variant="destructive"
            className="rounded-none border-x-0 border-b-0"
          >
            <AlertDescription>{chat.error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Right: PO Preview Panel (shown when draft has data) */}
      {showPanel && (
        <>
          <Separator orientation="vertical" />
          <div className="w-1/2 lg:w-2/5 bg-white overflow-y-auto">
            <POPreviewPanel
              draft={chat.poDraft!}
              isReady={chat.poReady}
              isSubmitted={chat.poSubmitted}
              onConfirm={chat.confirmPreview}
            />
          </div>
        </>
      )}
    </div>
  )
}
