import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function generateUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
  return uploadUrl
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  })

  const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
  return downloadUrl
}

export function getPublicUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export function generateFileKey(filename: string) {
  const timestamp = Date.now()
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${timestamp}_${cleanFilename}`
}
