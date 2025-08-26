import { NextRequest } from 'next/server'
import { stageService, CreateStageSchema } from '@/lib/services/stage.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { invalidateFlowCache } from '@/lib/utils/cache-invalidation'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id: flowId } = await params
  
  const stages = await stageService.getStagesByFlowId(flowId)
  
  return createSuccessResponse(
    { stages },
    {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    }
  )
})

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id: flowId } = await params
  
  const body = await request.json()
  
  // Get next position for this flow
  const existingStages = await stageService.getStagesByFlowId(flowId)
  const nextPosition = existingStages.length
  
  const data = CreateStageSchema.parse({
    ...body,
    flow_id: flowId,
    position: body.position ?? nextPosition,
  })
  
  const stage = await stageService.createStage(data)
  
  // Invalidate flow cache
  await invalidateFlowCache(flowId)
  
  return createSuccessResponse(
    { stage },
    {
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
