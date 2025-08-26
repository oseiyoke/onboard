import { NextRequest } from 'next/server'
import { stageService, UpdateStageSchema } from '@/lib/services/stage.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/api/errors'
import { invalidateFlowCache } from '@/lib/utils/cache-invalidation'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id } = await params
  
  const stage = await stageService.getStageById(id)
  
  if (!stage) {
    throw new NotFoundError('Stage not found')
  }
  
  return createSuccessResponse(
    { stage },
    {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    }
  )
})

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id } = await params
  
  const body = await request.json()
  const data = UpdateStageSchema.parse(body)
  
  const stage = await stageService.updateStage(id, data)
  
  // Invalidate flow cache
  await invalidateFlowCache(stage.flow_id)
  
  return createSuccessResponse(
    { stage },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id } = await params
  
  // Get stage info before deleting for cache invalidation
  const stage = await stageService.getStageById(id)
  if (!stage) {
    throw new NotFoundError('Stage not found')
  }
  
  await stageService.deleteStage(id)
  
  // Invalidate flow cache
  await invalidateFlowCache(stage.flow_id)
  
  return createSuccessResponse(
    { success: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
