import { NextRequest } from 'next/server'
import { progressService, CreateStageProgressSchema } from '@/lib/services/progress.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id: stageId } = await params
  
  const body = await request.json()
  
  const data = CreateStageProgressSchema.parse({
    ...body,
    user_id: user.id, // Override with authenticated user
    stage_id: stageId,
  })
  
  const progress = await progressService.markStageStarted(data)
  
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
