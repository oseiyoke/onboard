import { NextRequest } from 'next/server'
import { flowService, FlowQuerySchema, CreateFlowSchema } from '@/lib/services/flow.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createPaginatedResponse, createSuccessResponse } from '@/lib/api/errors'
import { invalidateFlowsCache } from '@/lib/utils/cache-invalidation'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth(request)
  
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())
  const query = FlowQuerySchema.parse(queryParams)
  
  const result = await flowService.getFlowsByOrg(user.orgId, query)
  
  return createPaginatedResponse(
    result.flows,
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
  const data = CreateFlowSchema.parse(body)
  
  const flow = await flowService.createFlow(user.orgId, user.id, data)
  
  // Invalidate flows cache to show the new flow
  await invalidateFlowsCache(user.orgId)
  
  return createSuccessResponse(
    { flow },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
