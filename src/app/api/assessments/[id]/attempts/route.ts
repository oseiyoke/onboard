import { NextRequest } from 'next/server'
import { assessmentService } from '@/lib/services/assessment.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createNotFoundResponse } from '@/lib/api/errors'

interface Params {
  id: string
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  const user = await requireAuth(request)
  const { id } = await params
  
  const body = await request.json()
  const { enrollmentId } = body
  
  // Check if assessment exists and is published
  const assessment = await assessmentService.getAssessmentById(id)
  if (!assessment) {
    return createNotFoundResponse('Assessment not found')
  }
  
  if (!assessment.is_published) {
    throw new Error('Assessment is not published')
  }
  
  // Check retry limit
  const existingAttempts = await assessmentService.getAttemptsByUser(user.id, id)
  if (existingAttempts.length >= assessment.retry_limit) {
    throw new Error('Maximum number of attempts reached')
  }
  
  const attempt = await assessmentService.createAttempt(id, user.id, enrollmentId)
  
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
