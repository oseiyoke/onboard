export interface ContentItem {
  id: string
  org_id: string
  name: string
  type: 'pdf' | 'video' | 'document' | 'image' | 'other'
  source: 'upload' | 'youtube' | 'gdrive' | 'external'
  file_url?: string
  external_url?: string
  file_size?: number
  thumbnail_url?: string
  duration?: number
  version: number
  view_count: number
  metadata: Record<string, unknown>
  created_at: string
  created_by: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UseContentParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  source?: string
}

import { useQuery } from '@tanstack/react-query'

export function useContent(params: UseContentParams = {}) {
  const {
    page = 1,
    limit = 50,
    search,
    type,
    source,
  } = params

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search ? { search } : {}),
    ...(type && type !== 'all' ? { type } : {}),
    ...(source && source !== 'all' ? { source } : {}),
  })

  return useQuery({
    queryKey: ['content', page, limit, search, type, source],
    queryFn: async () => {
      const res = await fetch(`/api/content?${queryParams}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error('Failed to fetch content')
      }
      return res.json() as Promise<{ data: ContentItem[]; pagination: PaginationInfo }>
    },
  })
}
