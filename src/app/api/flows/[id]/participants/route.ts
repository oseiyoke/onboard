import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'

interface RouteParams {
  params: { id: string }
}

// GET /api/flows/[id]/participants - Get all participants enrolled in a specific flow (admin only)
export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const admin = await requireAdmin(request)
  const flowId = params.id
  const supabase = await createClient()
  
  // Verify the flow exists and belongs to admin's org
  const { data: flow, error: flowError } = await supabase
    .from('onboard_flows')
    .select('id, name, org_id')
    .eq('id', flowId)
    .single()
  
  if (flowError || !flow) {
    throw new ValidationError('Flow not found', { flowId: ['Flow not found'] })
  }
  
  if (flow.org_id !== admin.orgId) {
    throw new ValidationError('Cannot access flows from other organizations', { 
      flowId: ['Access denied'] 
    })
  }
  
  // Get all participants enrolled in this flow with their progress
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('onboard_enrollments')
    .select(`
      id,
      user_id,
      status,
      started_at,
      completed_at,
      user:onboard_users(
        id,
        email,
        first_name,
        last_name,
        role,
        member
      )
    `)
    .eq('flow_id', flowId)
    .order('started_at', { ascending: false })
  
  if (enrollmentsError) {
    console.error('Participants fetch error:', enrollmentsError)
    throw new Error('Failed to fetch flow participants')
  }
  
  // Calculate progress for each participant
  const participantsWithProgress = await Promise.all(
    (enrollments ?? []).map(async (enrollment) => {
      // Get total items in flow  
      const { data: stages } = await supabase
        .from('onboard_stages')
        .select(`
          id,
          items:onboard_stage_items(id)
        `)
        .eq('flow_id', flowId)
      
      const totalItems = stages?.reduce((acc, stage) => acc + stage.items.length, 0) || 0
      
      // Get completed items for this participant
      const { data: completedItems } = await supabase
        .from('onboard_stage_item_progress')
        .select('id')
        .eq('user_id', enrollment.user_id)
        .eq('enrollment_id', enrollment.id)
        .not('completed_at', 'is', null)
      
      const completedCount = completedItems?.length || 0
      const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0
      
      // Get current stage progress
      const { data: stageProgress } = await supabase
        .from('onboard_stage_progress')
        .select(`
          stage:onboard_stages(title, position)
        `)
        .eq('user_id', enrollment.user_id)
        .eq('enrollment_id', enrollment.id)
        .is('completed_at', null)
        .order('stage.position', { ascending: true })
        .limit(1)
      
      return {
        id: enrollment.id,
        user: enrollment.user,
        status: enrollment.status,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        progress: {
          totalItems,
          completedCount,
          percentage,
          currentStage: stageProgress?.[0]?.stage || null
        }
      }
    })
  )
  
  return createSuccessResponse({
    flowId,
    flowName: flow.name,
    participants: participantsWithProgress,
  })
})
