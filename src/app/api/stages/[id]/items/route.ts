import { NextRequest } from 'next/server'
import { stageItemService, CreateStageItemSchema } from '@/lib/services/stage-item.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id: stageId } = await params
  
  const items = await stageItemService.getStageItems(stageId)
  
  return createSuccessResponse(
    { items },
    {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    }
  )
})

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id: stageId } = await params
  
  const body = await request.json()
  
  // Get next position for this stage
  const nextPosition = await stageItemService.getNextPosition(stageId)
  
  const data = CreateStageItemSchema.parse({
    ...body,
    stage_id: stageId,
    position: body.position ?? nextPosition,
  })
  
  const item = await stageItemService.createStageItem(data)
  
  return createSuccessResponse(
    { item },
    {
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
