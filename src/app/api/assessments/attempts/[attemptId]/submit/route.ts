import { NextRequest } from 'next/server'
import { assessmentService, SubmitAttemptSchema } from '@/lib/services/assessment.service'
import { requireAuth } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface Params {
  attemptId: string
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: Params }) => {
  const user = await requireAuth(request)
  
  const body = await request.json()
  const data = SubmitAttemptSchema.parse(body)
  
  const attempt = await assessmentService.submitAttempt(params.attemptId, data)
  
  return createSuccessResponse(
    { attempt },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
