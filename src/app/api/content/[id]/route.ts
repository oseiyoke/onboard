import { NextRequest } from 'next/server'
import { contentService, UpdateContentSchema } from '@/lib/services/content.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, createErrorResponse } from '@/lib/api/errors'

export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth(request) // Ensure user is authenticated
  const { id } = await params // Await params as required in Next.js 15
  
  const content = await contentService.getContentById(id)
  
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

export const PUT = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin(request) // Ensure user is admin
  const { id } = await params // Await params as required in Next.js 15
  
  const body = await request.json()
  
  // Map legacy field names to new schema
  const normalizedBody = {
    name: body.name,
    type: body.type,
    thumbnail_url: body.thumbnailUrl || body.thumbnail_url,
    metadata: body.metadata,
  }
  
  const data = UpdateContentSchema.parse(normalizedBody)
  
  const content = await contentService.updateContent(id, data)
  
  return createSuccessResponse(
    { content },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin(request) // Ensure user is admin
  const { id } = await params // Await params as required in Next.js 15
  
  await contentService.deleteContent(id)
  
  return createSuccessResponse(
    { message: 'Content deleted successfully' },
    {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
