import { Check } from 'lucide-react'

import POAmountSummary from '@/components/chat/po-preview/POAmountSummary'
import POFooterFields from '@/components/chat/po-preview/POFooterFields'
import POGstExtraCharges from '@/components/chat/po-preview/POGstExtraCharges'
import POHeaderFields from '@/components/chat/po-preview/POHeaderFields'
import POItemsTable from '@/components/chat/po-preview/POItemsTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { PODraft } from '@/lib/types/documents'

export default function POPreviewPanel({
  draft,
  isReady,
  isSubmitted,
  onConfirm,
}: {
  draft: PODraft
  isReady: boolean
  isSubmitted: boolean
  onConfirm: () => void
}) {
  const currencyValue = draft.currency.currency_value

  return (
    <div className="flex flex-col h-full">
      <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Purchase Order</h2>
        {isReady && !isSubmitted && (
          <Badge className="bg-green-500 text-white hover:bg-green-500">
            Ready
          </Badge>
        )}
        {isSubmitted && (
          <Badge className="bg-green-400 text-white hover:bg-green-400">
            Submitted
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <POHeaderFields draft={draft} />
        <POItemsTable
          items={draft.item_details.items}
          currencyValue={currencyValue}
        />
        <POGstExtraCharges
          charges={draft.gst_extra_charges}
          currencyValue={currencyValue}
        />
        <POAmountSummary
          amountDetails={draft.amount_details}
          tcsDetails={draft.tcs_details}
          currencyValue={currencyValue}
        />
        <POFooterFields draft={draft} />
      </div>

      {isReady && (
        <>
          <Separator />
          <div className="px-6 py-4">
            <Button
              disabled={isSubmitted}
              onClick={onConfirm}
              className={`w-full h-auto py-3 rounded-lg font-medium
              ${
                isSubmitted
                  ? 'bg-green-100 text-green-700 hover:bg-green-100 cursor-default'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Check size={18} />
              {isSubmitted ? 'Submitted' : 'Confirm & Submit'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
