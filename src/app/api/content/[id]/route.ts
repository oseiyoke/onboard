import { NextRequest } from 'next/server'
import { contentService, UpdateContentSchema } from '@/lib/services/content.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createErrorResponse } from '@/lib/api/errors'

export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAuth(request)
  
  const content = await contentService.getContentById(params.id)
  
  if (!content) {
    return createErrorResponse('Content not found', 404)
  }
  
  return createSuccessResponse(
    { content },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    }
  )
})

export const PUT = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  
  // Map legacy field names to new schema
  const normalizedBody = {
    name: body.name,
    type: body.type,
    thumbnail_url: body.thumbnailUrl || body.thumbnail_url,
    metadata: body.metadata,
  }
  
  const data = UpdateContentSchema.parse(normalizedBody)
  
  const content = await contentService.updateContent(params.id, data)
  
  return createSuccessResponse(
    { content },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAdmin(request)
  
  await contentService.deleteContent(params.id)
  
  return createSuccessResponse(
    { message: 'Content deleted successfully' },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
