/** API shapes for GET /api/sessions (snake_case from FastAPI). */

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
}

export interface SessionDetail {
  session_id: string
  title: string | null
  messages: StoredMessage[]
  po_draft: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

export interface SessionListResponse {
  sessions: SessionSummary[]
  total: number
}
