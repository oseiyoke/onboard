import { NextRequest } from 'next/server'
import { assessmentService } from '@/lib/services/assessment.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createNotFoundResponse } from '@/lib/api/errors'

interface Params {
  id: string
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  const user = await requireAuth(request)
  const { id } = await params
  
  // Get user's attempts for this assessment
  const attempts = await assessmentService.getAttemptsByUser(user.id, id)
  
  return createSuccessResponse(
    { attempts },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    }
  )
})

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
  // const existingAttempts = await assessmentService.getAttemptsByUser(user.id, id)
  // if (existingAttempts.length >= assessment.retry_limit) {
  //   throw new Error('Maximum number of attempts reached')
  // }
  
  const attempt = await assessmentService.createAttempt(id, user.id, enrollmentId)
  
  return createSuccessResponse(
    { attemptId: attempt.id },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
