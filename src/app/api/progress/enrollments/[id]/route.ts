import { NextRequest } from 'next/server'
import { progressService } from '@/lib/services/progress.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, NotFoundError, ForbiddenError } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id: enrollmentId } = await params
  
  // For now, users can only view their own progress
  // TODO: Add admin check to view any user's progress
  const progress = await progressService.getUserFlowProgress(user.id, enrollmentId)
  
  if (!progress) {
    throw new NotFoundError('Enrollment progress not found')
  }
  
  return createSuccessResponse(
    { progress },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
})
