import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import { useAuthStore } from '@/lib/store/auth-store'
import type { ProfileResponse } from '@/lib/types/profile'

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get<ProfileResponse>('/api/profile')
      return res.data
    },
    enabled: isAuthenticated,
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
