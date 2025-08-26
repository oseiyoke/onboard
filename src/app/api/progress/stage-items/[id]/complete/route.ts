import { NextRequest } from 'next/server'
import { progressService, CreateStageItemProgressSchema } from '@/lib/services/progress.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id: stageItemId } = await params
  
  const body = await request.json()
  
  const data = CreateStageItemProgressSchema.parse({
    ...body,
    user_id: user.id, // Override with authenticated user
    stage_item_id: stageItemId,
  })
  
  const progress = await progressService.markStageItemCompleted(data)
  
  return createSuccessResponse(
    { progress },
    {
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
