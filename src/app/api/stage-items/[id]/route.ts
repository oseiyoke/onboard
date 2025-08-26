import { NextRequest } from 'next/server'
import { stageItemService, UpdateStageItemSchema } from '@/lib/services/stage-item.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id } = await params
  
  const item = await stageItemService.getStageItemById(id)
  
  if (!item) {
    throw new NotFoundError('Stage item not found')
  }
  
  return createSuccessResponse(
    { item },
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
  const data = UpdateStageItemSchema.parse(body)
  
  const item = await stageItemService.updateStageItem(id, data)
  
  return createSuccessResponse(
    { item },
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
  
  await stageItemService.deleteStageItem(id)
  
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
