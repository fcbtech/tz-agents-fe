import { Separator } from '@/components/ui/separator'

/** Label on the left, value on the right. Renders nothing if value is missing or whitespace-only. */
export default function FieldRow({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  return (
    <>
      <div className="flex justify-between items-start py-2">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="font-medium text-sm text-right max-w-[60%]">
          {trimmed}
        </span>
      </div>
      <Separator />
    </>
  )
}
