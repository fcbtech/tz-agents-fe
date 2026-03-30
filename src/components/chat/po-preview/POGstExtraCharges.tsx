import SectionHeading from '@/components/chat/po-preview/SectionHeading'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GstExtraCharge } from '@/lib/types/documents'
import { formatCurrency, formatTaxNames } from '@/lib/utils/po-format'
import { calcGstChargeTax } from '@/lib/utils/po-calc'

const EM = '\u2014'

export default function POGstExtraCharges({
  charges,
  currencyValue,
}: {
  charges?: GstExtraCharge[]
  currencyValue?: number
}) {
  if (!charges?.length) return null

  return (
    <div className="mt-6">
      <SectionHeading>GST Extra Charges</SectionHeading>
      <div className="overflow-x-auto mt-2">
        <Table className="min-w-[560px] text-xs">
          <TableHeader>
            <TableRow className="border-gray-200 text-gray-500">
              <TableHead className="py-2 w-8">#</TableHead>
              <TableHead className="py-2 min-w-[120px]">Description</TableHead>
              <TableHead className="py-2 text-right w-28">Total</TableHead>
              <TableHead className="py-2 min-w-[100px]">Tax</TableHead>
              <TableHead className="py-2 text-right min-w-[88px]">
                Total Tax
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.map((charge, i) => {
              const total = charge.total ?? 0
              const taxAmt = calcGstChargeTax(charge)
              return (
                <TableRow key={`${charge.description ?? 'gst'}-${i}`}>
                  <TableCell className="py-2 text-gray-400">{i + 1}</TableCell>
                  <TableCell className="py-2 text-gray-800">
                    {charge.description ?? EM}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {formatCurrency(total, currencyValue)}
                  </TableCell>
                  <TableCell className="py-2 text-gray-600 whitespace-normal">
                    {formatTaxNames(charge.taxes) ?? EM}
                  </TableCell>
                  <TableCell className="py-2 text-right font-medium">
                    {formatCurrency(taxAmt, currencyValue)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
