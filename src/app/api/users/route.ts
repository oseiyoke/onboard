import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAdmin(request)

  const supabase = await createClient()

  // Get all users in the same organization
  const { data: users, error } = await supabase
    .from('onboard_users')
    .select('id, email, role, first_name, last_name, member, created_at')
    .eq('org_id', user.orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Users fetch error:', error)
    throw new Error('Failed to fetch users')
  }

  return createSuccessResponse({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.first_name,
      lastName: u.last_name,
      member: u.role === 'admin' || u.member || false,
      createdAt: u.created_at,
    }))
  })
})
