import { Badge } from '@/components/ui/badge'
import type { Mention } from '@/types/chat'

interface Props {
  mention: Mention
}

const TYPE_COLORS: Record<string, string> = {
  counterparty: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  item: 'bg-green-100 text-green-800 hover:bg-green-100',
  tax: 'bg-red-100 text-red-800 hover:bg-red-100',
  doc_number: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
  payment_terms: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100',
  store: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  billing_address: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  delivery_location: 'bg-teal-100 text-teal-800 hover:bg-teal-100',
  supplier_address: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  bank: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  logistics: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  terms_and_conditions: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
}

export default function MentionChip({ mention }: Props) {
  return (
    <Badge
      variant="secondary"
      className={`text-xs ${TYPE_COLORS[mention.type] ?? 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
    >
      @{mention.displayName}
    </Badge>
  )
}
