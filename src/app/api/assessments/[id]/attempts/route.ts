import { NextRequest } from 'next/server'
import { assessmentService, SubmitAttemptSchema } from '@/lib/services/assessment.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createNotFoundResponse } from '@/lib/api/errors'

interface Params {
  id: string
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: Params }) => {
  const user = await requireAuth(request)
  
  const body = await request.json()
  const { enrollmentId } = body
  
  // Check if assessment exists and is published
  const assessment = await assessmentService.getAssessmentById(params.id)
  if (!assessment) {
    return createNotFoundResponse('Assessment not found')
  }
  
  if (!assessment.is_published) {
    throw new Error('Assessment is not published')
  }
  
  // Check retry limit
  const existingAttempts = await assessmentService.getAttemptsByUser(user.id, params.id)
  if (existingAttempts.length >= assessment.retry_limit) {
    throw new Error('Maximum number of attempts reached')
  }
  
  const attempt = await assessmentService.createAttempt(params.id, user.id, enrollmentId)
  
  return createSuccessResponse(
    { attempt },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
