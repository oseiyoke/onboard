import { generateUploadUrl, generateFileKey } from '@/lib/r2-storage'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { z } from 'zod'

const UploadRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().positive('File size must be positive').max(50 * 1024 * 1024, 'File size too large'),
})

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  const { filename, contentType, size } = UploadRequestSchema.parse(body)

  // Validate content type
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new ValidationError('File type not allowed', {
      contentType: ['Unsupported file type']
    })
  }

  // Generate file key and upload URL
  const fileKey = generateFileKey(user.orgId, filename)
  const uploadUrl = await generateUploadUrl(fileKey, contentType)

  return createSuccessResponse({
    uploadUrl,
    fileKey,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${fileKey}`
  })
})
