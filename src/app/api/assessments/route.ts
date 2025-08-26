import { NextRequest } from 'next/server'
import { assessmentService, AssessmentQuerySchema, CreateAssessmentSchema } from '@/lib/services/assessment.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createPaginatedResponse, createSuccessResponse } from '@/lib/api/errors'

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuth(request) // Just need authentication, not user data
  
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())
  const query = AssessmentQuerySchema.parse(queryParams)
  
  const result = await assessmentService.getAssessments(query)
  
  return createPaginatedResponse(
    result.assessments,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    }
  )
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  // Parse without org_id - it will be fetched from the user's record
  const data = CreateAssessmentSchema.omit({ org_id: true }).parse(body)

  console.log('Creating assessment with data:', data)

  const assessment = await assessmentService.createAssessment(user.id, data)
  
  return createSuccessResponse(
    { assessment },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
