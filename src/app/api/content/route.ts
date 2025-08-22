import { NextRequest } from 'next/server'
import { contentService, ContentQuerySchema, CreateContentSchema } from '@/lib/services/content.service'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createPaginatedResponse, createSuccessResponse } from '@/lib/api/errors'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth(request)
  
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())
  const query = ContentQuerySchema.parse(queryParams)
  
  const result = await contentService.getContent(query)
  
  return createPaginatedResponse(
    result.content,
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
  
  // Map legacy field names to new schema
  const normalizedBody = {
    name: body.name,
    type: body.type,
    file_url: body.fileUrl || body.file_url,
    file_size: body.fileSize || body.file_size,
    metadata: body.metadata || {},
  }
  
  const data = CreateContentSchema.parse(normalizedBody)
  
  const content = await contentService.createContent(user.id, data)
  
  return createSuccessResponse(
    { content },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
