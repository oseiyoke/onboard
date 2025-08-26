import { NextRequest } from 'next/server'
import { assessmentService, SubmitAttemptSchema } from '@/lib/services/assessment.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface Params {
  attemptId: string
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAuth(request) // Ensure user is authenticated
  const { attemptId } = await params // Await params as required in Next.js 15
  
  const body = await request.json()
  const data = SubmitAttemptSchema.parse(body)
  
  const attempt = await assessmentService.submitAttempt(attemptId, data)
  
  return createSuccessResponse(
    { attempt },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
