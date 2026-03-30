import FieldRow from '@/components/chat/po-preview/FieldRow'
import SectionHeading from '@/components/chat/po-preview/SectionHeading'
import type { AmountDetails, TcsDetails } from '@/lib/types/documents'
import {
  formatCurrency,
  formatNtecValue,
  formatTcsPercent,
} from '@/lib/utils/po-format'

export default function POAmountSummary({
  amountDetails,
  tcsDetails,
  currencyValue,
}: {
  amountDetails: AmountDetails
  tcsDetails?: TcsDetails
  currencyValue?: number
}) {
  const ntecs = amountDetails.non_taxable_extra_charges ?? []

  const rows: { key: string; label: string; value: string }[] = []

  for (let i = 0; i < ntecs.length; i++) {
    const charge = ntecs[i]
    const desc = charge.charge_description?.trim()
    rows.push({
      key: `ntec-${i}`,
      label: desc ?? '',
      value: formatNtecValue(charge, currencyValue),
    })
  }

  if (amountDetails.reverse_charge !== undefined) {
    rows.push({
      key: 'rcm',
      label: 'RCM',
      value: amountDetails.reverse_charge ? 'Yes' : 'No',
    })
  }

  if (tcsDetails?.value !== undefined) {
    const pct = formatTcsPercent(tcsDetails.value)
    if (pct) {
      rows.push({
        key: 'tcs',
        label: 'TCS',
        value: pct,
      })
    }
  }

  if (amountDetails.grand_total_round_off !== undefined) {
    rows.push({
      key: 'round-off',
      label: 'Round Off',
      value: amountDetails.grand_total_round_off ? 'Yes' : 'No',
    })
  }

  if (amountDetails.base_advance_to_pay !== undefined) {
    rows.push({
      key: 'advance',
      label: 'Advance to Pay',
      value: formatCurrency(amountDetails.base_advance_to_pay, currencyValue),
    })
  }

  if (!rows.length) return null

  return (
    <div className="mt-6 space-y-1">
      <SectionHeading>Amount Details</SectionHeading>
      {rows.map((row) => (
        <FieldRow key={row.key} label={row.label} value={row.value} />
      ))}
    </div>
  )
}
