import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'

// GET /api/flows/available - Get all flows in the user's org with enrollment status
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth(request)
  const supabase = await createClient()
  console.log('user', user)
  
  // Get all flows in the user's organization with optional enrollment info
  const { data: flows, error } = await supabase
    .from('onboard_flows')
    .select(`
      id,
      name,
      description,
      enrollments:onboard_enrollments!left(
        id,
        status,
        started_at,
        completed_at
      )
    `)
    .eq('org_id', user.orgId)
    .eq('enrollments.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Available flows fetch error:', error)
    throw new Error('Failed to fetch available flows')
  }

  // Calculate progress for flows that have enrollments
  const flowsWithProgress = await Promise.all(
    flows.map(async (flow) => {
      const enrollment = flow.enrollments[0] || null
      let progress = null

      if (enrollment) {
        // Get total stages and items for this flow
        const { data: stages } = await supabase
          .from('onboard_stages')
          .select(`
            id,
            items:onboard_stage_items(id)
          `)
          .eq('flow_id', flow.id)

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

        progress = {
          completed_items: completedCount,
          total_items: totalItems,
          percentage: progressPercentage,
        }
      }

      return {
        flow: {
          id: flow.id,
          name: flow.name,
          description: flow.description,
        },
        enrollment,
        progress,
      }
    })
  )

  return createSuccessResponse(
    { flows: flowsWithProgress },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  )
})
