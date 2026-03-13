import { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api/axios'
import type { MasterDataItem } from '@/lib/types/master-data'

export function useMentionSearch(entityType: string | null, query: string) {
  const [results, setResults] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!entityType) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query, limit: '10' })
        const { data } = await apiClient.get<{
          data: Array<MasterDataItem & { title?: string }>
        }>(`/api/master/${entityType}`, { params })
        setResults(
          data.data.map((item) => ({
            ...item,
            name: item.name || item.title || (item.itemid as string) || '',
          })),
        )
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [entityType, query])

  return { results, loading }
}
