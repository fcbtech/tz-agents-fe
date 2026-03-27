/** API shapes for GET /api/sessions (snake_case from FastAPI). */

import type { Mention } from '@/lib/types/chat'
import type { PODraft } from '@/lib/types/documents'

export interface SessionSummary {
  session_id: string
  title: string | null
  created_at: string | null
  updated_at: string | null
}

export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  mentions?: Mention[]
}

export interface SessionDetail {
  session_id: string
  title: string | null
  messages: StoredMessage[]
  po_draft: PODraft | null
  created_at: string | null
  updated_at: string | null
}

export interface SessionListResponse {
  sessions: SessionSummary[]
  total: number
}
