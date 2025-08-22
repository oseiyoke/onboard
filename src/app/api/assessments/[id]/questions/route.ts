import { NextRequest } from 'next/server'
import { assessmentService, CreateQuestionSchema } from '@/lib/services/assessment.service'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'

interface Params {
  id: string
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: { params: Params }) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  const data = CreateQuestionSchema.parse(body)
  
  const question = await assessmentService.createQuestion(params.id, data)
  
  return createSuccessResponse(
    { question },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: Params }) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  const { questionIds } = body
  
  if (!Array.isArray(questionIds)) {
    throw new Error('questionIds must be an array')
  }
  
  await assessmentService.reorderQuestions(params.id, questionIds)
  
  return createSuccessResponse({ success: true })
})
