import { NextRequest } from 'next/server'
import { progressService } from '@/lib/services/progress.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request) // Only admins can view flow progress summary
  const { id: flowId } = await params
  
  const summary = await progressService.getFlowProgressSummary(flowId)
  
  return createSuccessResponse(
    { summary },
    {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    }
  )
})
