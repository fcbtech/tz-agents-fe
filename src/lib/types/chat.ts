import type { MasterDataEntityType } from '@/lib/types/master-data'

export interface Mention {
  type: MasterDataEntityType
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
