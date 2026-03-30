import { Clock } from 'lucide-react'

import SectionHeading from '@/components/chat/po-preview/SectionHeading'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CustomField, POItem } from '@/lib/types/documents'
import {
  formatCurrency,
  formatDiscount,
  formatTaxNames,
} from '@/lib/utils/po-format'
import {
  calcItemTaxAmount,
  calcItemUntaxedAmount,
  calcItemsSubtotal,
} from '@/lib/utils/po-calc'

function ItemMeta({
  comment,
  customFields,
}: {
  comment?: string
  customFields?: CustomField[]
}) {
  const hasComment = Boolean(comment?.trim())
  const cfs = customFields?.filter((cf) => cf.name?.trim() && cf.value) ?? []
  if (!hasComment && cfs.length === 0) return null
  return (
    <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
      {hasComment ? (
        <p className="italic whitespace-normal">{comment}</p>
      ) : null}
      {cfs.map((cf) => (
        <p key={cf.uuid} className="whitespace-normal">
          {cf.name}: {cf.value}
        </p>
      ))}
    </div>
  )
}

export default function POItemsTable({
  items,
  currencyValue,
}: {
  items: POItem[]
  currencyValue?: number
}) {
  const hasItems = items.length > 0
  const subtotal = calcItemsSubtotal(items)

  return (
    <div className="mt-6">
      <SectionHeading>Line Items</SectionHeading>

      {!hasItems ? (
        <Card className="border-dashed py-6 gap-0 items-center mt-2">
          <CardContent className="text-center text-gray-300 text-sm italic p-0">
            <Clock size={16} className="mx-auto mb-1" />
            No items yet
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto mt-2">
          <Table className="min-w-[900px] text-xs">
            <TableHeader>
              <TableRow className="border-gray-200 text-gray-500">
                <TableHead className="py-2 w-8">#</TableHead>
                <TableHead className="py-2 min-w-[140px]">Item</TableHead>
                <TableHead className="py-2 text-center w-20">HSN</TableHead>
                <TableHead className="py-2 text-right w-14">Qty</TableHead>
                <TableHead className="py-2 text-center w-16">Unit</TableHead>
                <TableHead className="py-2 text-center min-w-[72px]">
                  Alt Unit
                </TableHead>
                <TableHead className="py-2 text-right w-24">Rate</TableHead>
                <TableHead className="py-2 text-right w-16">Disc 1</TableHead>
                <TableHead className="py-2 text-right w-16">Disc 2</TableHead>
                <TableHead className="py-2 text-right w-16">Disc 3</TableHead>
                <TableHead className="py-2 text-right min-w-[88px]">
                  Before Tax
                </TableHead>
                <TableHead className="py-2 min-w-[100px]">Tax</TableHead>
                <TableHead className="py-2 text-right min-w-[88px]">
                  Total Tax
                </TableHead>
                <TableHead className="py-2 text-right min-w-[88px]">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => {
                const qty =
                  item.quantity != null && item.quantity !== ''
                    ? Number(item.quantity)
                    : null
                const rate = item.price != null ? Number(item.price) : null
                const untaxed = calcItemUntaxedAmount(item)
                const taxAmt = calcItemTaxAmount(item)
                const totalLine = untaxed + taxAmt
                const d1 = formatDiscount(
                  item.item_discount_type_1,
                  currencyValue,
                )
                const d2 = formatDiscount(
                  item.item_discount_type_2,
                  currencyValue,
                )
                const d3 = formatDiscount(
                  item.item_discount_type_3,
                  currencyValue,
                )
                const altQty = item.alternate_quantity
                const altUnit = item.alternate_unit?.name
                const altStr =
                  altQty != null && altUnit
                    ? `${altQty} ${altUnit}`
                    : altUnit || (altQty != null ? String(altQty) : undefined)

                return (
                  <TableRow
                    key={`${item.product}-${i}`}
                    className="border-gray-100"
                  >
                    <TableCell className="py-2 text-gray-400">
                      {i + 1}
                    </TableCell>
                    <TableCell className="py-2 wrap-break-words whitespace-normal max-w-[180px]">
                      <span className="text-gray-900">{item.name}</span>
                      <ItemMeta
                        comment={item.comment}
                        customFields={item.custom_fields}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-center text-gray-600">
                      {item.hsn_code ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-600">
                      {qty != null && Number.isFinite(qty) ? qty : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-center text-gray-600">
                      {item.unit?.name ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-center text-gray-600">
                      {altStr ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-600">
                      {rate != null && Number.isFinite(rate)
                        ? formatCurrency(rate, currencyValue)
                        : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-600">
                      {d1 ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-600">
                      {d2 ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-600">
                      {d3 ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-800">
                      {formatCurrency(untaxed, currencyValue)}
                    </TableCell>
                    <TableCell className="py-2 text-gray-600 whitespace-normal">
                      {formatTaxNames(item.taxes) ?? '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right text-gray-800">
                      {formatCurrency(taxAmt, currencyValue)}
                    </TableCell>
                    <TableCell className="py-2 text-right font-medium">
                      {formatCurrency(totalLine, currencyValue)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            {subtotal > 0 && (
              <TableFooter className="bg-transparent">
                <TableRow className="border-t-2 border-gray-300">
                  <TableCell
                    colSpan={13}
                    className="py-2 text-right font-semibold"
                  >
                    Subtotal
                  </TableCell>
                  <TableCell className="py-2 text-right font-bold">
                    {formatCurrency(subtotal, currencyValue)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      )}
    </div>
  )
}
