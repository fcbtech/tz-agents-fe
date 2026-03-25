import { useState, useEffect, useRef, useMemo } from 'react'
import {
  searchBillingAddresses,
  searchBanks,
  searchCounterparties,
  searchDeliveryLocations,
  searchDocNumbers,
  searchItems,
  searchLogistics,
  searchPaymentTerms,
  searchStores,
  searchSupplierAddresses,
  searchTaxes,
  searchTermsAndConditions,
} from '@/lib/api/master-data'
import { useChatStore } from '@/lib/store/chat-store'
import type { PODraft } from '@/lib/types/documents'
import type {
  MasterDataEntityType,
  MasterDataRow,
} from '@/lib/types/master-data'

function supplierCompanyId(draft: PODraft | null): string | undefined {
  if (!draft) return undefined
  return (
    draft.supplier_details.supplier_company_details?.company_id ||
    draft.buyer_details.buyer_company_details?.company_id
  )
}

export function useMentionSearch(
  entityType: MasterDataEntityType | null,
  query: string,
) {
  const poDraft = useChatStore((s) => s.poDraft)
  const counterpartyCompanyId = useMemo(
    () => supplierCompanyId(poDraft),
    [poDraft],
  )
  const [results, setResults] = useState<MasterDataRow[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!entityType) {
      clearTimeout(debounceRef.current)
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const limit = 10
        let rows: MasterDataRow[]

        switch (entityType) {
          case 'counterparty':
            rows = await searchCounterparties(query, limit)
            break
          case 'item':
            rows = await searchItems(query, limit)
            break
          case 'tax':
            rows = await searchTaxes(limit)
            break
          case 'doc_number':
            rows = await searchDocNumbers(undefined, limit)
            break
          case 'payment_terms':
            rows = await searchPaymentTerms(query, limit)
            break
          case 'store':
            rows = await searchStores(query, limit)
            break
          case 'billing_address':
            rows = await searchBillingAddresses(undefined, limit)
            break
          case 'delivery_location':
            rows = await searchDeliveryLocations(undefined, limit)
            break
          case 'supplier_address':
            rows = counterpartyCompanyId
              ? await searchSupplierAddresses(
                  counterpartyCompanyId,
                  undefined,
                  limit,
                )
              : []
            break
          case 'bank':
            rows = await searchBanks(limit)
            break
          case 'logistics':
            rows = await searchLogistics(limit)
            break
          case 'terms_and_conditions':
            rows = await searchTermsAndConditions(limit)
            break
          default:
            rows = []
        }

        setResults(rows)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [entityType, query, counterpartyCompanyId])

  return { results, loading }
}
