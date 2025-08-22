import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { z } from 'zod'

const OnboardSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Name too long'),
  role: z.enum(['admin', 'participant']),
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Get authenticated user (but don't require onboarding)
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  const body = await request.json()
  const { firstName, lastName, role } = OnboardSchema.parse(body)

  // Update user profile that should already exist from trigger
  const { error: userError } = await supabase
    .from('onboard_users')
    .update({
      role,
      first_name: firstName,
      last_name: lastName
    })
    .eq('id', user.id)

  if (userError) {
    console.error('User update error:', userError)
    throw new Error('Failed to update profile')
  }

  return createSuccessResponse({ success: true })
})
