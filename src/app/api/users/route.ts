import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'

// Default pagination settings
const DEFAULT_LIMIT = 25;

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAdmin(request)

  const supabase = await createClient()

  // Pagination parameters
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1

  const from = (page - 1) * limit
  const to = from + limit - 1

  // Fetch paginated users and total count in single query
  const { data: users, error, count } = await supabase
    .from('onboard_users')
    .select('id, email, role, first_name, last_name, member, created_at', { count: 'exact' })
    .eq('org_id', user.orgId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Users fetch error:', error)
    throw new Error('Failed to fetch users')
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return createSuccessResponse({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.first_name,
      lastName: u.last_name,
      member: u.role === 'admin' || u.member || false,
      createdAt: u.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
})
