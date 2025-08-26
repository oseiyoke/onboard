import { NextRequest } from 'next/server'
import { assessmentService, UpdateQuestionSchema } from '@/lib/services/assessment.service'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface Params {
  id: string
  questionId: string
}

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAdmin(request)
  const { questionId } = await params
  
  const body = await request.json()
  const data = UpdateQuestionSchema.parse(body)
  
  const question = await assessmentService.updateQuestion(questionId, data)
  
  return createSuccessResponse(
    { question },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAdmin(request)
  const { questionId } = await params
  
  await assessmentService.deleteQuestion(questionId)
  
  return createSuccessResponse({ success: true })
})
