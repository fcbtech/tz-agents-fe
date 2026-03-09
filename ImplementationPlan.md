# Frontend Implementation Plan — Agentic ERP Chat (v0.1)

## Goal

Build a React chat interface where users create Purchase Orders through natural language conversation. The key features are: a Tiptap-based input with `@` mentions for selecting master data (counterparties, items, terms, billing addresses), SSE streaming of agent responses, clarification cards with "Figure it out" buttons, and a **split-screen layout** — chat on the left, live PO preview panel on the right that builds up progressively as fields are collected.

---

## Step 1: Install Dependencies

```bash
bun add zustand @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/pm tippy.js
```

**What each does:**

- `zustand` — Lightweight state management (better than Context for streaming token updates)
- `@tiptap/react` — ProseMirror-based rich text editor with React bindings
- `@tiptap/starter-kit` — Bundle of basic Tiptap extensions
- `@tiptap/extension-mention` — Built-in `@` mention with suggestion popup
- `@tiptap/extension-placeholder` — Placeholder text support
- `@tiptap/pm` — ProseMirror peer dependency
- `tippy.js` — Popup positioning for the mention dropdown

---

## Step 2: Types

### 2.1 Create `src/types/chat.ts`

```typescript
export interface Mention {
  type: 'counterparty' | 'item' | 'terms' | 'billing_address'
  id: string
  displayName: string
  metadata: Record<string, unknown>
}

export interface ClarificationPayload {
  question: string
  field: string
  options: Array<{
    label: string
    value: string
    isFigureItOut: boolean
  }>
  answered?: boolean
  selectedValue?: string
}

export interface SubmitResult {
  success: boolean
  poId?: string
  poNumber?: string
  error?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  mentions?: Mention[]
  timestamp: number

  // Structured payloads (assistant only, mutually exclusive)
  clarification?: ClarificationPayload
  submitResult?: SubmitResult
  // NOTE: PO preview is NOT in chat messages — it lives in the right-side panel
}
```

### 2.2 Create `src/types/documents.ts`

```typescript
/**
 * PODraft represents the progressively-built PO state.
 * Fields are optional because the draft fills up incrementally.
 * Shown in the right-side panel as soon as any field is populated.
 */
export interface PODraft {
  counterparty?: { id: string; name: string }
  items?: Array<{
    item_id: string
    name: string
    qty?: number
    unit?: string
    rate?: number
    total?: number
  }>
  terms?: { id: string; name: string }
  billing_address?: { id: string; text: string }
  subtotal?: number
  notes?: string
}

/** Final preview payload sent by backend when all required fields are filled */
export interface POPreviewPayload extends Required<PODraft> {
  items: Array<{
    item_id: string
    name: string
    qty: number
    unit: string
    rate: number
    total: number
  }>
  subtotal: number
}
```

### 2.3 Create `src/types/master-data.ts`

```typescript
export interface MasterDataCategory {
  type: string
  label: string
  icon: string
}

export interface MasterDataItem {
  id: string
  name: string
  [key: string]: unknown // Additional entity-specific fields
}
```

---

## Step 3: Library Utilities

### 3.1 Create `src/lib/constants.ts`

```typescript
export const API_BASE_URL = 'http://localhost:8000'

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  counterparty: 'Counterparties',
  item: 'Items',
  terms: 'Terms & Conditions',
  billing_address: 'Billing Addresses',
}
```

### 3.2 Create `src/lib/api.ts`

Simple fetch wrapper.

```typescript
import { API_BASE_URL } from './constants'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}
```

### 3.3 Create `src/lib/sse.ts`

Custom SSE parser for POST responses. Browser's `EventSource` only supports GET, so we parse the SSE stream from a `fetch()` response body manually.

```typescript
import { API_BASE_URL } from './constants'

export interface SSEEvent {
  event: string
  data: string
}

export async function* streamSSE(
  path: string,
  body: Record<string, unknown>,
): AsyncGenerator<SSEEvent> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    let currentEvent = 'message'
    let currentData = ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6)
      } else if (line === '') {
        if (currentData) {
          yield { event: currentEvent, data: currentData }
          currentEvent = 'message'
          currentData = ''
        }
      }
    }
  }
}
```

---

## Step 4: Zustand Store

### 4.1 Create `src/stores/chat-store.ts`

```typescript
import { create } from 'zustand'
import type { ChatMessage, Mention } from '@/types/chat'
import type { PODraft } from '@/types/documents'

interface ChatStore {
  sessionId: string | null
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  error: string | null

  // PO draft state — shown in the right-side preview panel
  poDraft: PODraft | null
  poReady: boolean // true when all required fields are filled
  poSubmitted: boolean // true after successful submission

  // Actions
  setSessionId: (id: string) => void
  addUserMessage: (content: string, mentions?: Mention[]) => void
  addAssistantMessage: (partial: Partial<ChatMessage>) => void
  appendStreamingContent: (token: string) => void
  finalizeStreaming: () => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  markClarificationAnswered: (messageId: string, selectedValue: string) => void
  updatePODraft: (draft: PODraft) => void
  setPOReady: (ready: boolean) => void
  setPOSubmitted: (submitted: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  error: null,
  poDraft: null,
  poReady: false,
  poSubmitted: false,

  setSessionId: (id) => set({ sessionId: id }),

  addUserMessage: (content, mentions) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content,
          mentions,
          timestamp: Date.now(),
        },
      ],
    })),

  addAssistantMessage: (partial) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: '',
          timestamp: Date.now(),
          ...partial,
        },
      ],
    })),

  appendStreamingContent: (token) =>
    set((state) => ({
      streamingContent: state.streamingContent + token,
    })),

  finalizeStreaming: () =>
    set((state) => {
      if (!state.streamingContent) return state
      return {
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: state.streamingContent,
            timestamp: Date.now(),
          },
        ],
        streamingContent: '',
        isStreaming: false,
      }
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setError: (error) => set({ error, isStreaming: false }),

  markClarificationAnswered: (messageId, selectedValue) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.clarification
          ? {
              ...m,
              clarification: {
                ...m.clarification,
                answered: true,
                selectedValue,
              },
            }
          : m,
      ),
    })),

  updatePODraft: (draft) =>
    set((state) => ({
      // Merge incoming draft fields with existing draft
      poDraft: state.poDraft ? { ...state.poDraft, ...draft } : draft,
    })),

  setPOReady: (ready) => set({ poReady: ready }),

  setPOSubmitted: (submitted) => set({ poSubmitted: submitted }),

  reset: () =>
    set({
      sessionId: null,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
      poDraft: null,
      poReady: false,
      poSubmitted: false,
    }),
}))
```

---

## Step 5: Core Chat Hook

### 5.1 Create `src/hooks/useChat.ts`

This hook connects the Zustand store to the SSE streaming endpoint. It handles sending messages and processing the streamed response.

```typescript
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
        session_id: store.sessionId,
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
```

### 5.2 Create `src/hooks/useMentionSearch.ts`

Debounced search for `@` mention autocomplete.

```typescript
import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import type { MasterDataItem } from '@/types/master-data'

export function useMentionSearch(entityType: string | null, query: string) {
  const [results, setResults] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!entityType) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query, limit: '10' })
        const data = await apiFetch<{ data: MasterDataItem[] }>(
          `/api/master/${entityType}?${params}`,
        )
        setResults(data.data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [entityType, query])

  return { results, loading }
}
```

---

## Step 6: Chat Components

### 6.1 Create `src/components/chat/ChatContainer.tsx`

**Split-screen layout:** Chat on the left, PO preview panel on the right. The right panel appears (slides in) as soon as `poDraft` has any data. When no draft data exists, the chat takes the full width.

```typescript
import { useChat } from '@/hooks/useChat'
import MessageList from './MessageList'
import POPreviewPanel from './POPreviewPanel'
import ChatInput from '../input/ChatInput'

export default function ChatContainer() {
  const chat = useChat()
  const showPanel = chat.poDraft !== null

  return (
    <div className="flex h-screen bg-slate-50">
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
        <div className="border-t border-gray-200 bg-white p-4">
          <ChatInput
            onSend={chat.sendMessage}
            disabled={chat.isStreaming}
          />
        </div>

        {/* Error display */}
        {chat.error && (
          <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-t border-red-200">
            {chat.error}
          </div>
        )}
      </div>

      {/* Right: PO Preview Panel (shown when draft has data) */}
      {showPanel && (
        <div className="w-1/2 lg:w-2/5 border-l border-gray-200 bg-white overflow-y-auto">
          <POPreviewPanel
            draft={chat.poDraft!}
            isReady={chat.poReady}
            isSubmitted={chat.poSubmitted}
            onConfirm={chat.confirmPreview}
          />
        </div>
      )}
    </div>
  )
}
```

### 6.2 Create `src/components/chat/MessageList.tsx`

Scrollable list of messages with auto-scroll. **Note:** PO preview is NOT rendered here — it lives in the right-side panel. Only text messages, clarifications, and submit results appear in the message list.

```typescript
import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types/chat'
import MessageBubble from './MessageBubble'
import ClarificationCard from './ClarificationCard'
import SubmitResultCard from './SubmitResultCard'
import TypingIndicator from './TypingIndicator'

interface Props {
  messages: ChatMessage[]
  streamingContent: string
  isStreaming: boolean
  onClarificationSelect: (messageId: string, field: string, value: string) => void
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
      {streamingContent && (
        <MessageBubble
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
            timestamp: Date.now(),
          }}
        />
      )}

      {isStreaming && !streamingContent && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}
```

### 6.3 Create `src/components/chat/MessageBubble.tsx`

Renders a single user or assistant message. User messages show inline `@` mention chips.

```typescript
import type { ChatMessage } from '@/types/chat'
import MentionChip from './MentionChip'

interface Props {
  message: ChatMessage
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Show mention chips for user messages */}
        {isUser && message.mentions && message.mentions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.mentions.map((mention) => (
              <MentionChip key={mention.id} mention={mention} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 6.4 Create `src/components/chat/MentionChip.tsx`

Styled inline chip for `@` mentioned entities.

```typescript
import type { Mention } from '@/types/chat'

interface Props {
  mention: Mention
}

const TYPE_COLORS: Record<string, string> = {
  counterparty: 'bg-purple-100 text-purple-800',
  item: 'bg-green-100 text-green-800',
  terms: 'bg-amber-100 text-amber-800',
  billing_address: 'bg-blue-100 text-blue-800',
}

export default function MentionChip({ mention }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        TYPE_COLORS[mention.type] ?? 'bg-gray-100 text-gray-800'
      }`}
    >
      @{mention.displayName}
    </span>
  )
}
```

### 6.5 Create `src/components/chat/ClarificationCard.tsx`

Renders a clarification question from the agent with option buttons and a "Figure it out" button.

```typescript
import { Sparkles } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'

interface Props {
  message: ChatMessage
  onSelect: (field: string, value: string) => void
  onFigureItOut: (field: string) => void
}

export default function ClarificationCard({
  message,
  onSelect,
  onFigureItOut,
}: Props) {
  const clar = message.clarification!
  const isAnswered = clar.answered

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md shadow-sm">
        <p className="text-gray-800 font-medium mb-3">{clar.question}</p>

        <div className="flex flex-col gap-2">
          {clar.options
            .filter((o) => !o.isFigureItOut)
            .map((option) => (
              <button
                key={option.value}
                disabled={isAnswered}
                onClick={() => onSelect(clar.field, option.value)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors text-sm
                  ${
                    isAnswered && clar.selectedValue === option.value
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                  }
                  ${isAnswered ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
              >
                {option.label}
              </button>
            ))}

          <button
            disabled={isAnswered}
            onClick={() => onFigureItOut(clar.field)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed
              border-amber-300 text-amber-700 font-medium text-sm transition-colors
              ${
                isAnswered && clar.selectedValue === 'figure_it_out'
                  ? 'bg-amber-50'
                  : ''
              }
              ${isAnswered ? 'opacity-60 cursor-default' : 'hover:bg-amber-50 cursor-pointer'}`}
          >
            <Sparkles size={16} />
            Figure it out
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 6.6 Create `src/components/chat/POPreviewPanel.tsx`

**This is the right-side panel**, not an inline chat card. It shows the PO draft progressively — fields appear as they're collected. Missing fields show as placeholder rows with a subtle "pending" style. The "Confirm & Submit" button appears only when all required fields are filled (`isReady`).

```typescript
import { Check, Clock } from 'lucide-react'
import type { PODraft } from '@/types/documents'

interface Props {
  draft: PODraft
  isReady: boolean
  isSubmitted: boolean
  onConfirm: () => void
}

/** Render a field row: filled or pending placeholder */
function FieldRow({
  label,
  value,
}: {
  label: string
  value: string | undefined
}) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100">
      <span className="text-gray-500 text-sm">{label}</span>
      {value ? (
        <span className="font-medium text-sm text-right max-w-[60%]">
          {value}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-gray-300 text-sm italic">
          <Clock size={12} />
          Pending
        </span>
      )}
    </div>
  )
}

export default function POPreviewPanel({
  draft,
  isReady,
  isSubmitted,
  onConfirm,
}: Props) {
  const hasItems = draft.items && draft.items.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Purchase Order</h2>
        {isReady && !isSubmitted && (
          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
            Ready
          </span>
        )}
        {isSubmitted && (
          <span className="text-xs bg-green-400 text-white px-2 py-1 rounded-full">
            Submitted
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-1">
          <FieldRow label="Supplier" value={draft.counterparty?.name} />
          <FieldRow label="Terms" value={draft.terms?.name} />
          <FieldRow label="Billing Address" value={draft.billing_address?.text} />
          {draft.notes && <FieldRow label="Notes" value={draft.notes} />}
        </div>

        {/* Line Items */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Line Items
          </h3>

          {!hasItems ? (
            <div className="text-center py-6 text-gray-300 text-sm italic border border-dashed border-gray-200 rounded-lg">
              <Clock size={16} className="mx-auto mb-1" />
              No items yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-left">
                  <th className="py-2">#</th>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {draft.items!.map((item, i) => (
                  <tr key={item.item_id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right text-gray-600">
                      {item.qty != null ? `${item.qty} ${item.unit ?? ''}` : '—'}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {item.rate != null ? `$${item.rate.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {item.total != null ? `$${item.total.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>

              {draft.subtotal != null && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={4} className="py-2 text-right font-semibold">
                      Subtotal
                    </td>
                    <td className="py-2 text-right font-bold">
                      ${draft.subtotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* Footer: Confirm button (only when ready) */}
      {isReady && (
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            disabled={isSubmitted}
            onClick={onConfirm}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors
              ${
                isSubmitted
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
              }`}
          >
            <Check size={18} />
            {isSubmitted ? 'Submitted' : 'Confirm & Submit'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### 6.7 Create `src/components/chat/SubmitResultCard.tsx`

```typescript
import { CheckCircle, XCircle } from 'lucide-react'
import type { SubmitResult } from '@/types/chat'

interface Props {
  result: SubmitResult
}

export default function SubmitResultCard({ result }: Props) {
  return (
    <div className="flex justify-start">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
          result.success
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}
      >
        {result.success ? (
          <>
            <CheckCircle size={20} />
            <span>
              PO <strong>{result.poNumber ?? result.poId}</strong> created
              successfully!
            </span>
          </>
        ) : (
          <>
            <XCircle size={20} />
            <span>Failed to create PO: {result.error}</span>
          </>
        )}
      </div>
    </div>
  )
}
```

### 6.8 Create `src/components/chat/TypingIndicator.tsx`

```typescript
export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
```

---

## Step 7: Tiptap Chat Input with @ Mentions

This is the most complex frontend piece. It has two parts: the Tiptap editor configuration and the two-phase mention dropdown.

### 7.1 Create `src/components/input/ChatInput.tsx`

```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Send } from 'lucide-react'
import { createMentionExtension } from './MentionExtension'
import type { Mention } from '@/types/chat'

interface Props {
  onSend: (text: string, mentions: Mention[]) => void
  disabled: boolean
}

/**
 * Extract plain text and structured mentions from Tiptap's JSON document.
 */
function extractMentions(json: Record<string, unknown>): {
  text: string
  mentions: Mention[]
} {
  const mentions: Mention[] = []
  let text = ''

  function walk(node: Record<string, unknown>) {
    if (node.type === 'mention') {
      const attrs = node.attrs as Record<string, unknown>
      mentions.push({
        type: (attrs.category as string) ?? 'counterparty',
        id: attrs.id as string,
        displayName: attrs.label as string,
        metadata: (attrs.metadata as Record<string, unknown>) ?? {},
      })
      text += `@${attrs.label}`
    } else if (node.type === 'text') {
      text += node.text as string
    } else if (node.type === 'paragraph' || node.type === 'doc') {
      const content = (node.content as Record<string, unknown>[]) ?? []
      content.forEach(walk)
      if (node.type === 'paragraph') text += '\n'
    }
  }

  walk(json)
  return { text: text.trim(), mentions }
}

export default function ChatInput({ onSend, disabled }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need in a chat input
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder: 'Type a message... Use @ to mention master data',
      }),
      createMentionExtension(),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[40px] max-h-[120px] overflow-y-auto',
      },
      handleKeyDown: (_view, event) => {
        // Send on Enter (without Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          handleSend()
          return true
        }
        return false
      },
    },
  })

  const handleSend = () => {
    if (!editor || editor.isEmpty || disabled) return

    const json = editor.getJSON()
    const { text, mentions } = extractMentions(json)

    if (!text) return

    onSend(text, mentions)
    editor.commands.clearContent()
  }

  return (
    <div className="flex items-end gap-2 max-w-3xl mx-auto">
      <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
        <EditorContent editor={editor} />
      </div>
      <button
        onClick={handleSend}
        disabled={disabled}
        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={20} />
      </button>
    </div>
  )
}
```

### 7.2 Create `src/components/input/MentionExtension.ts`

Configures Tiptap's mention extension with the two-phase dropdown.

```typescript
import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import MentionDropdown from './MentionDropdown'

export function createMentionExtension() {
  return Mention.configure({
    HTMLAttributes: {
      class:
        'mention-chip bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md text-sm font-medium',
    },
    suggestion: {
      char: '@',
      items: () => {
        // Actual data fetching happens inside MentionDropdown
        // We return empty here; the component handles everything
        return []
      },
      render: () => {
        let component: ReactRenderer
        let popup: Instance[]

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionDropdown, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) return

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              maxWidth: 320,
            })
          },
          onUpdate: (props) => {
            component?.updateProps(props)
            if (props.clientRect && popup?.[0]) {
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              })
            }
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide()
              return true
            }
            return (
              component?.ref as { onKeyDown: (props: unknown) => boolean }
            )?.onKeyDown(props)
          },
          onExit: () => {
            popup?.[0]?.destroy()
            component?.destroy()
          },
        }
      },
    },
  })
}
```

### 7.3 Create `src/components/input/MentionDropdown.tsx`

The two-phase dropdown: first shows categories, then shows searchable entity list.

```typescript
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react'
import { Building, Package, FileText, MapPin, Search } from 'lucide-react'
import { useMentionSearch } from '@/hooks/useMentionSearch'
import type { MasterDataCategory } from '@/types/master-data'

const CATEGORIES: Array<MasterDataCategory & { icon: typeof Building }> = [
  { type: 'counterparty', label: 'Counterparties', icon: Building },
  { type: 'item', label: 'Items', icon: Package },
  { type: 'terms', label: 'Terms & Conditions', icon: FileText },
  { type: 'billing_address', label: 'Billing Addresses', icon: MapPin },
]

interface Props {
  command: (attrs: Record<string, unknown>) => void
}

const MentionDropdown = forwardRef((props: Props, ref) => {
  const [phase, setPhase] = useState<'categories' | 'search'>('categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { results, loading } = useMentionSearch(selectedCategory, searchQuery)

  const selectCategory = (type: string) => {
    setSelectedCategory(type)
    setPhase('search')
    setSearchQuery('')
    setSelectedIndex(0)
  }

  const selectItem = useCallback(
    (item: { id: string; name: string; [key: string]: unknown }) => {
      props.command({
        id: item.id,
        label: item.name,
        category: selectedCategory,
        metadata: item,
      })
    },
    [props, selectedCategory],
  )

  // Keyboard navigation
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      const items = phase === 'categories' ? CATEGORIES : results
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i > 0 ? i - 1 : items.length - 1))
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i < items.length - 1 ? i + 1 : 0))
        return true
      }
      if (event.key === 'Enter') {
        if (phase === 'categories') {
          selectCategory(CATEGORIES[selectedIndex].type)
        } else if (results[selectedIndex]) {
          selectItem(results[selectedIndex])
        }
        return true
      }
      if (event.key === 'Backspace' && phase === 'search' && !searchQuery) {
        setPhase('categories')
        setSelectedCategory(null)
        setSelectedIndex(0)
        return true
      }
      return false
    },
  }))

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Phase 1: Category selection
  if (phase === 'categories') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-64">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
          Select Category
        </div>
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.type}
              onClick={() => selectCategory(cat.type)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
                ${i === selectedIndex ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon size={16} className="text-gray-400" />
              {cat.label}
            </button>
          )
        })}
      </div>
    )
  }

  // Phase 2: Search within category
  const categoryLabel =
    CATEGORIES.find((c) => c.type === selectedCategory)?.label ?? ''

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-72">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 flex items-center justify-between">
        <span>{categoryLabel}</span>
        <button
          onClick={() => {
            setPhase('categories')
            setSelectedCategory(null)
          }}
          className="text-blue-500 text-xs hover:underline"
        >
          Back
        </button>
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-400">
          <Search size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {loading && (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            Loading...
          </div>
        )}
        {!loading && results.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            No results found
          </div>
        )}
        {!loading &&
          results.map((item, i) => (
            <button
              key={item.id}
              onClick={() => selectItem(item)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors
                ${i === selectedIndex ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {item.name}
            </button>
          ))}
      </div>
    </div>
  )
})

MentionDropdown.displayName = 'MentionDropdown'
export default MentionDropdown
```

---

## Step 8: Route Setup

### 8.1 Update `src/routes/index.tsx`

Replace the scaffold landing page with the chat interface.

```typescript
import { createFileRoute } from '@tanstack/react-router'
import ChatContainer from '@/components/chat/ChatContainer'

export const Route = createFileRoute('/')({ component: ChatPage })

function ChatPage() {
  return <ChatContainer />
}
```

### 8.2 Add mention chip styles to `src/styles.css`

Add at the bottom of the existing `styles.css`:

```css
/* Tiptap mention chips in editor */
.mention-chip {
  @apply bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md text-sm font-medium;
}

/* Tiptap placeholder */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
```

---

## Step 9: Verification Checklist

1. **Dev server starts:** `bun --bun run dev` — no build errors
2. **Chat renders:** Visit `http://localhost:3000` — see chat input and empty message list, no right panel yet
3. **Type and send:** Type a message, hit Enter or click Send — message appears as user bubble
4. **SSE streaming:** With backend running, send a message — agent response streams token by token
5. **@ mentions:** Type `@` — category dropdown appears → select category → search box → select item → chip inserted
6. **Mention data sent:** On send, check network tab — POST body includes `mentions[]` with UUIDs
7. **Split screen appears:** After selecting a counterparty via @, the right panel slides in showing "Supplier: ABC Company" with other fields as "Pending"
8. **Progressive build-up:** As the agent collects more fields (terms, items), they appear in the right panel in real-time
9. **Clarification card:** Agent asks a question — card with options + "Figure it out" renders in chat
10. **Ready state:** When all fields are filled, the panel shows "Ready" badge and the "Confirm & Submit" button appears
11. **Submit result:** Click Confirm — success card appears in chat, panel shows "Submitted" badge
12. **Lint clean:** `bun run check` passes

---

## File Checklist

```
[ ] src/types/chat.ts
[ ] src/types/documents.ts
[ ] src/types/master-data.ts
[ ] src/lib/constants.ts
[ ] src/lib/api.ts
[ ] src/lib/sse.ts
[ ] src/stores/chat-store.ts
[ ] src/hooks/useChat.ts
[ ] src/hooks/useMentionSearch.ts
[ ] src/components/chat/ChatContainer.tsx
[ ] src/components/chat/MessageList.tsx
[ ] src/components/chat/MessageBubble.tsx
[ ] src/components/chat/MentionChip.tsx
[ ] src/components/chat/ClarificationCard.tsx
[ ] src/components/chat/POPreviewPanel.tsx
[ ] src/components/chat/SubmitResultCard.tsx
[ ] src/components/chat/TypingIndicator.tsx
[ ] src/components/input/ChatInput.tsx
[ ] src/components/input/MentionExtension.ts
[ ] src/components/input/MentionDropdown.tsx
[ ] src/routes/index.tsx (updated)
[ ] src/styles.css (updated)
```
