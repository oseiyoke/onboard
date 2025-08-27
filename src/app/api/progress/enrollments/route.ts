import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const CreateEnrollmentSchema = z.object({
  flow_id: z.string().uuid(),
})

// GET /api/progress/enrollments - Get participant's enrolled flows with progress
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth(request)
  const supabase = await createClient()
  
  // Get enrollments with flow info and progress calculations
  const { data: enrollments, error } = await supabase
    .from('onboard_enrollments')
    .select(`
      id,
      flow_id,
      status,
      started_at,
      completed_at,
      flow:onboard_flows(
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Enrollments fetch error:', error)
    throw new Error('Failed to fetch enrollments')
  }

  // Calculate progress for each enrollment
  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Get total stages and items for this flow
      const { data: stages } = await supabase
        .from('onboard_stages')
        .select(`
          id,
          items:onboard_stage_items(id)
        `)
        .eq('flow_id', enrollment.flow_id)

      const totalItems = stages?.reduce((acc, stage) => acc + stage.items.length, 0) || 0

      // Get completed items for this enrollment
      const { data: completedItems } = await supabase
        .from('onboard_stage_item_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollment.id)
        .not('completed_at', 'is', null)

      const completedCount = completedItems?.length || 0
      const progressPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

      return {
        id: enrollment.id,
        flow_id: enrollment.flow_id,
        flow: enrollment.flow,
        status: enrollment.status,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        progress: {
          completed_items: completedCount,
          total_items: totalItems,
          percentage: progressPercentage,
        },
      }
    })
  )

  return createSuccessResponse(
    { enrollments: enrollmentsWithProgress },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  )
})

// POST /api/progress/enrollments - Create enrollment for a flow
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth(request)
  const supabase = await createClient()
  
  const body = await request.json()
  const { flow_id } = CreateEnrollmentSchema.parse(body)
  
  // Verify the flow exists and belongs to the user's org
  const { data: flow, error: flowError } = await supabase
    .from('onboard_flows')
    .select('id')
    .eq('id', flow_id)
    .eq('org_id', user.orgId)
    .single()
  
  if (flowError || !flow) {
    throw new Error('Flow not found or not accessible')
  }
  
  // Check if enrollment already exists
  const { data: existingEnrollment } = await supabase
    .from('onboard_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('flow_id', flow_id)
    .single()
  
  if (existingEnrollment) {
    return createSuccessResponse({ enrollment_id: existingEnrollment.id })
  }
  
  // Create new enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('onboard_enrollments')
    .insert({
      user_id: user.id,
      flow_id: flow_id,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  
  if (enrollmentError || !enrollment) {
    console.error('Enrollment creation error:', enrollmentError)
    throw new Error('Failed to create enrollment')
  }
  
  return createSuccessResponse({ enrollment_id: enrollment.id })
})

