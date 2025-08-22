import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/api/errors'
import { generateFileKey, getPublicUrl } from '@/lib/r2-storage'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAdmin(request)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    throw new ValidationError('File is required', { file: ['Missing file'] })
  }

  const filename = file.name || 'upload'
  const contentType = file.type || 'application/octet-stream'
  const size = file.size

  if (size > 50 * 1024 * 1024) {
    throw new ValidationError('File too large', { file: ['Max 50MB'] })
  }

  const fileKey = generateFileKey(filename)

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer()
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    Body: Buffer.from(arrayBuffer),
    ContentType: contentType,
  })

  await r2Client.send(command)

  return createSuccessResponse({
    fileKey,
    publicUrl: getPublicUrl(fileKey),
  }, { status: 201 })
})
