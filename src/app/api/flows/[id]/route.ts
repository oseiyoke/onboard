import { NextRequest } from 'next/server'
import { flowService, UpdateFlowSchema } from '@/lib/services/flow.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/api/errors'
import { invalidateFlowCache, invalidateFlowsCache } from '@/lib/utils/cache-invalidation'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request)
  const { id } = await params
  
  const flow = await flowService.getFlowById(id)
  
  if (!flow) {
    throw new NotFoundError('Flow not found')
  }
  
  return createSuccessResponse(
    { flow },
    {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    }
  )
})

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id } = await params
  
  const body = await request.json()
  const data = UpdateFlowSchema.parse(body)
  
  const flow = await flowService.updateFlow(id, data)
  
  // Invalidate cache for the updated flow
  await invalidateFlowCache(id)
  
  return createSuccessResponse(
    { flow },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAdmin(request)
  const { id } = await params
  
  await flowService.deleteFlow(id)
  
  // Invalidate cache for the deleted flow and flows list
  await invalidateFlowsCache()
  
  return createSuccessResponse(
    { success: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
