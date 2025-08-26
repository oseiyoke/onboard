import { useQuery } from '@tanstack/react-query'

export interface Assessment {
  id: string
  org_id: string
  name: string
  description?: string
  passing_score: number
  max_attempts?: number
  time_limit?: number
  is_published: boolean
  created_at: string
  created_by: string
}

interface UseAssessmentsParams {
  page?: number
  limit?: number
  search?: string
  is_published?: boolean
}

export function useAssessments(params: UseAssessmentsParams = {}) {
  const {
    page = 1,
    limit = 50,
    search,
    is_published, // If undefined, fetch both published and draft assessments
  } = params

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search ? { search } : {}),
    ...(is_published !== undefined ? { is_published: is_published.toString() } : {}),
  })

  return useQuery({
    queryKey: ['assessments', page, limit, search, is_published],
    queryFn: async () => {
      const res = await fetch(`/api/assessments?${queryParams}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error('Failed to fetch assessments')
      }
      const json = await res.json() as {
        data: Assessment[]
        pagination: {
          total: number
          page: number
          limit: number
        }
      }

      return {
        assessments: json.data,
        total: json.pagination.total,
        page: json.pagination.page,
        limit: json.pagination.limit,
      }
    },
  })
}
