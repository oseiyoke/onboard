import { NextRequest } from 'next/server'
import { assessmentService, UpdateQuestionSchema } from '@/lib/services/assessment.service'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface Params {
  id: string
  questionId: string
}

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: Params }) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  const data = UpdateQuestionSchema.parse(body)
  
  const question = await assessmentService.updateQuestion(params.questionId, data)
  
  return createSuccessResponse(
    { question },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: Params }) => {
  const user = await requireAdmin(request)
  
  await assessmentService.deleteQuestion(params.questionId)
  
  return createSuccessResponse({ success: true })
})
