import { NextRequest } from 'next/server'
import { stageItemService, ReorderStageItemsSchema } from '@/lib/services/stage-item.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id: stageId } = await params
  
  const body = await request.json()
  const data = ReorderStageItemsSchema.parse(body)
  
  await stageItemService.reorderStageItems(stageId, data)
  
  return createSuccessResponse(
    { success: true },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
