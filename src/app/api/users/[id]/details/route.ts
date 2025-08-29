import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'

export const GET = withErrorHandler(async (request: NextRequest, context: any) => {
  const admin = await requireAdmin(request)
  const userId = context?.params?.id as string

  const supabase = await createClient()

  // Verify the user exists and belongs to same org
  const { data: user, error: userError } = await supabase
    .from('onboard_users')
    .select('id, org_id')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new ValidationError('User not found', { userId: ['User not found'] })
  }

  if (user.org_id !== admin.orgId) {
    throw new ValidationError('Cannot access users from other organizations', { 
      userId: ['Access denied'] 
    })
  }

  // Fetch user's enrollments with flow data
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('onboard_enrollments')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      flow:onboard_flows(id, name)
    `)
    .eq('user_id', userId)

  if (enrollmentsError) {
    console.error('Enrollments fetch error:', enrollmentsError)
    throw new Error('Failed to fetch user enrollments')
  }

  // Calculate progress for each enrollment
  const enrollmentsWithProgress = await Promise.all(
    (enrollments ?? []).map(async (enrollment) => {
      // Supabase join returns 'flow' as an array; pick first entry's id
      const flowIdForCount = Array.isArray(enrollment.flow) ? enrollment.flow[0]?.id : (enrollment.flow as any)?.id

      const { data: stages } = await supabase
        .from('onboard_stages')
        .select(`
          id,
          items:onboard_stage_items(id)
        `)
        .eq('flow_id', flowIdForCount)

      const totalItems = stages?.reduce((acc, stage) => acc + stage.items.length, 0) || 0

      // Get completed items for this enrollment
      const { data: completedItems } = await supabase
        .from('onboard_stage_item_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('enrollment_id', enrollment.id)
        .not('completed_at', 'is', null)

      const completedCount = completedItems?.length || 0
      const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

      return {
        id: enrollment.id,
        status: enrollment.status,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        flow: enrollment.flow,
        progress: {
          totalItems,
          completedCount,
          percentage,
        },
      }
    })
  )

  return createSuccessResponse({
    enrollments: enrollmentsWithProgress,
  })
})
