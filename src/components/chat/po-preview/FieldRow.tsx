import { Clock } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

/** Label on the left, value on the right. Can optionally show a pending placeholder. */
export default function FieldRow({
  label,
  value,
  showPending = false,
}: {
  label: string
  value?: string
  showPending?: boolean
}) {
  const trimmed = value?.trim()
  if (!trimmed && !showPending) return null

  return (
    <>
      <div className="flex justify-between items-start py-2">
        <span className="text-gray-500 text-sm">{label}</span>
        {trimmed ? (
          <span className="font-medium text-sm text-right max-w-[60%]">
            {trimmed}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-300 text-sm italic">
            <Clock size={12} />
            Pending
          </span>
        )}
      </div>
      <Separator />
    </>
  )
}
