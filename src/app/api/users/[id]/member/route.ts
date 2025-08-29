import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const UpdateMemberSchema = z.object({
  member: z.boolean(),
})

export const PATCH = withErrorHandler(async (request: NextRequest, { params }) => {
  const user = await requireAdmin(request)
  const userId = params.id
  
  const body = await request.json()
  const { member } = UpdateMemberSchema.parse(body)

  const supabase = await createClient()

  // Verify the user being updated is in the same organization
  const { data: targetUser, error: targetUserError } = await supabase
    .from('onboard_users')
    .select('org_id, role')
    .eq('id', userId)
    .single()

  if (targetUserError || !targetUser) {
    throw new ValidationError('User not found', { userId: ['User not found'] })
  }

  if (targetUser.org_id !== user.orgId) {
    throw new ValidationError('Cannot modify users from other organizations', { 
      userId: ['Access denied'] 
    })
  }

  // Prevent changing admin's member status (admins are always members)
  if (targetUser.role === 'admin' && !member) {
    throw new ValidationError('Cannot remove member status from admin users', {
      member: ['Admins are always members']
    })
  }

  // Update member status
  const { error: updateError } = await supabase
    .from('onboard_users')
    .update({ member })
    .eq('id', userId)

  if (updateError) {
    console.error('Member update error:', updateError)
    throw new Error('Failed to update member status')
  }

  return createSuccessResponse({ 
    success: true,
    message: `User member status ${member ? 'granted' : 'revoked'} successfully`
  })
})
