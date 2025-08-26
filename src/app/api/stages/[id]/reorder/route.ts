import { NextRequest } from 'next/server'
import { stageService, ReorderStagesSchema } from '@/lib/services/stage.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { invalidateFlowCache } from '@/lib/utils/cache-invalidation'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id: flowId } = await params
  
  const body = await request.json()
  const data = ReorderStagesSchema.parse(body)
  
  await stageService.reorderStages(flowId, data)
  
  // Invalidate flow cache
  await invalidateFlowCache(flowId)
  
  return createSuccessResponse(
    { success: true },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
