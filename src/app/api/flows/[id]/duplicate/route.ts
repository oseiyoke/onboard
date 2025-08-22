import { NextRequest } from 'next/server'
import { flowService } from '@/lib/services/flow.service'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { invalidateFlowsCache } from '@/lib/utils/cache-invalidation'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id } = await params
  
  const flow = await flowService.duplicateFlow(id, user.orgId, user.id)
  
  // Invalidate flows cache to show the duplicated flow
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
