import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { z } from 'zod'

const OnboardSchema = z.object({
  orgName: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  orgSlug: z.string().min(1, 'Organization slug is required').max(50, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
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
  const { orgName, orgSlug, firstName, lastName, role } = OnboardSchema.parse(body)

  // Check if organization slug is already taken
  const { data: existingOrg } = await supabase
    .from('onboard_organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (existingOrg) {
    throw new ValidationError('Organization URL is already taken', {
      orgSlug: ['This URL is already taken']
    })
  }

  // Check if user is already onboarded
  const { data: existingUser } = await supabase
    .from('onboard_users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existingUser) {
    throw new ValidationError('User is already onboarded')
  }

  // Create organization
  const orgId = crypto.randomUUID()
  const { error: orgInsertError } = await supabase
    .from('onboard_organizations')
    .insert({
      id: orgId,
      name: orgName,
      slug: orgSlug,
      settings: {}
    })

  if (orgInsertError) {
    console.error('Organization creation error:', orgInsertError)
    throw new Error('Failed to create organization')
  }

  // Create user profile
  const { error: userError } = await supabase
    .from('onboard_users')
    .insert({
      id: user.id,
      org_id: orgId,
      email: user.email || '',
      role: role,
      first_name: firstName,
      last_name: lastName
    })

  if (userError) {
    console.error('User creation error:', userError)
    // Clean up the organization if user creation fails
    await supabase
      .from('onboard_organizations')
      .delete()
      .eq('id', orgId)
    
    throw new Error('Failed to create user profile')
  }

  // Fetch organization now that user profile exists (SELECT policy will pass)
  const { data: org, error: orgFetchError } = await supabase
    .from('onboard_organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (orgFetchError) {
    console.error('Organization fetch error:', orgFetchError)
    throw new Error('Failed to fetch organization after creation')
  }

  return createSuccessResponse({ 
    success: true,
    organization: org
  })
})
