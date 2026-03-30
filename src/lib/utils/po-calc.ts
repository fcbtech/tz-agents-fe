import type { GstExtraCharge, POItem } from '@/lib/types/documents'

function parseQty(item: POItem): number {
  if (item.quantity == null || item.quantity === '') return 0
  const n = Number(item.quantity)
  return Number.isFinite(n) ? n : 0
}

/**
 * Line amount after sequential discounts (TranZact `documents/setters/base.py` ladder).
 */
export function calcItemUntaxedAmount(item: POItem): number {
  const qty = parseQty(item)
  const price = item.price ?? 0
  let running = qty * price
  const discounts = [
    item.item_discount_type_1,
    item.item_discount_type_2,
    item.item_discount_type_3,
  ]
  for (const d of discounts) {
    if (!d) continue
    if (d.type === 0) {
      running -= d.value
    } else if (d.type === 1) {
      running -= running * (d.value / 100)
    } else if (d.type === 2) {
      running -= d.value * qty
    }
  }
  return Math.max(running, 0)
}

export function calcItemTaxAmount(item: POItem): number {
  const untaxed = calcItemUntaxedAmount(item)
  const taxes = item.taxes ?? []
  let sum = 0
  for (const tax of taxes) {
    const pct = tax.tax_percentage ?? 0
    sum += (untaxed * pct) / 100
  }
  return sum
}

export function calcItemsSubtotal(items: POItem[]): number {
  return items.reduce((sum, item) => sum + calcItemUntaxedAmount(item), 0)
}

export function calcGstChargeTax(charge: GstExtraCharge): number {
  const base = charge.total ?? 0
  const taxes = charge.taxes ?? []
  let sum = 0
  for (const tax of taxes) {
    const pct = tax.tax_percentage ?? 0
    sum += (base * pct) / 100
  }
  return sum
}
