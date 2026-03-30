import { Clock } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

/** Label on the left, value or pending placeholder on the right. */
export default function FieldRow({
  label,
  value,
}: {
  label: string
  value: string | undefined
}) {
  return (
    <>
      <div className="flex justify-between items-start py-2">
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
      <Separator />
    </>
  )
}
