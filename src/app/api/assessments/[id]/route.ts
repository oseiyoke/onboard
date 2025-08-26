import { NextRequest } from 'next/server'
import { assessmentService, UpdateAssessmentSchema } from '@/lib/services/assessment.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createNotFoundResponse } from '@/lib/api/errors'

interface Params {
  id: string
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAuth(request)
  const { id } = await params
  
  const url = new URL(request.url)
  const includeQuestions = url.searchParams.get('includeQuestions') === 'true'
  
  const assessment = await assessmentService.getAssessmentById(id, includeQuestions)
  
  if (!assessment) {
    return createNotFoundResponse('Assessment not found')
  }
  
  return createSuccessResponse(
    { assessment },
    {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    }
  )
})

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAdmin(request)
  const { id } = await params
  
  const body = await request.json()
  const data = UpdateAssessmentSchema.parse(body)
  
  const assessment = await assessmentService.updateAssessment(id, data)
  
  return createSuccessResponse(
    { assessment },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAdmin(request)
  const { id } = await params
  
  await assessmentService.deleteAssessment(id)
  
  return createSuccessResponse({ success: true })
})
