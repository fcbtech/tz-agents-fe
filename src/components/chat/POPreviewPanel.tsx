import { Check, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from '@/components/ui/table'
import type { PODraft } from '@/lib/types/documents'

interface Props {
  draft: PODraft
  isReady: boolean
  isSubmitted: boolean
  onConfirm: () => void
}

/** Render a field row: filled or pending placeholder */
function FieldRow({
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

export default function POPreviewPanel({
  draft,
  isReady,
  isSubmitted,
  onConfirm,
}: Props) {
  const items = draft.item_details.items
  const hasItems = items.length > 0

  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    const qty = item.quantity != null ? Number(item.quantity) : 0
    const price = item.price ?? 0
    return sum + qty * price
  }, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-1">
          <FieldRow
            label="Buyer"
            value={draft.buyer_details.buyer_company_details?.name}
          />
          <FieldRow
            label="Supplier"
            value={
              draft.supplier_details.supplier_company_details?.name
            }
          />
          <FieldRow
            label="Payment Terms"
            value={draft.primary_document_details.payment_terms?.name}
          />
          <FieldRow
            label="Store"
            value={draft.primary_document_details.store_details?.name}
          />
          <FieldRow
            label="Delivery Date"
            value={draft.primary_document_details.delivery_date}
          />
          <FieldRow
            label="Logistics"
            value={
              draft.additional_document_details.selected_logistic_details?.name
            }
          />
          <FieldRow
            label="Terms & Conditions"
            value={
              draft.additional_document_details
                .selected_terms_and_conditions?.name
            }
          />
          {draft.comment?.value && (
            <FieldRow label="Comment" value={draft.comment.value} />
          )}
        </div>

        {/* Line Items */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Line Items
          </h3>

          {!hasItems ? (
            <Card className="border-dashed py-6 gap-0 items-center">
              <CardContent className="text-center text-gray-300 text-sm italic p-0">
                <Clock size={16} className="mx-auto mb-1" />
                No items yet
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 text-gray-500">
                  <TableHead className="py-2">#</TableHead>
                  <TableHead className="py-2">Item</TableHead>
                  <TableHead className="py-2 text-right">Qty</TableHead>
                  <TableHead className="py-2 text-right">Rate</TableHead>
                  <TableHead className="py-2 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => {
                  const qty =
                    item.quantity != null ? Number(item.quantity) : null
                  const rate = item.price != null ? Number(item.price) : null
                  const total = qty != null && rate != null ? qty * rate : null
                  return (
                    <TableRow
                      key={item.product}
                      className="border-gray-100"
                    >
                      <TableCell className="py-2 text-gray-400">
                        {i + 1}
                      </TableCell>
                      <TableCell className="py-2 break-words whitespace-normal max-w-[150px]">
                        {item.name}
                      </TableCell>
                      <TableCell className="py-2 text-right text-gray-600">
                        {qty != null ? qty : '\u2014'}
                      </TableCell>
                      <TableCell className="py-2 text-right text-gray-600">
                        {rate != null ? `\u20B9${rate.toFixed(2)}` : '\u2014'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">
                        {total != null ? `\u20B9${total.toFixed(2)}` : '\u2014'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>

              {subtotal > 0 && (
                <TableFooter className="bg-transparent">
                  <TableRow className="border-t-2 border-gray-300">
                    <TableCell
                      colSpan={4}
                      className="py-2 text-right font-semibold"
                    >
                      Subtotal
                    </TableCell>
                    <TableCell className="py-2 text-right font-bold">
                      {'\u20B9'}
                      {subtotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          )}
        </div>
      </div>

      {/* Footer: Confirm button (only when ready) */}
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
