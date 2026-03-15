import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { ChatMessage, Mention } from '@/lib/types/chat'
import type { PODraft } from '@/lib/types/documents'

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

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
    (set) => ({
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
    }),
    {
      name: 'tz-chat',
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
        poDraft: state.poDraft,
        poReady: state.poReady,
        poSubmitted: state.poSubmitted,
      }),
    },
    ),
    { name: 'chat-store', enabled: true },
  ),
)

// Expose store for browser console debugging: __chatStore.getState()
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__chatStore = useChatStore
}
