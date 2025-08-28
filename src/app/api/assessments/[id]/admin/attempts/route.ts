import { NextRequest } from 'next/server'
import { assessmentService } from '@/lib/services/assessment.service'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createPaginatedResponse } from '@/lib/api/errors'
import { z } from 'zod'

interface Params {
  id: string
}

const AttemptsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  userId: z.string().uuid().optional(),
  passed: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
})

export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<Params> }) => {
  await requireAdmin(request) // Ensure user is admin
  const { id } = await params
  
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())
  const query = AttemptsQuerySchema.parse(queryParams)
  
  // Check if assessment exists
  const assessment = await assessmentService.getAssessmentById(id)
  if (!assessment) {
    return new Response('Assessment not found', { status: 404 })
  }
  
  const result = await assessmentService.getAssessmentAttempts(id, {
    page: query.page,
    limit: query.limit,
    userId: query.userId,
    passed: query.passed,
  })
  
  return createPaginatedResponse(
    result.attempts,
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
