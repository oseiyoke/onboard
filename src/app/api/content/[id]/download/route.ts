import { NextRequest } from 'next/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { createClient } from '@/utils/supabase/server'
import { generateDownloadUrl } from '@/lib/r2-storage'

export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: contentId } = await params // Await params as required in Next.js 15

  const supabase = await createClient()
  const { data: content, error } = await supabase
    .from('onboard_content')
    .select('*')
    .eq('id', contentId)
    .single()

  if (error || !content) {
    return new Response(JSON.stringify({ error: 'Content not found' }), { status: 404 })
  }

  if (content.source !== 'upload') {
    return new Response(JSON.stringify({ error: 'Signed URL only available for uploaded content' }), { status: 400 })
  }

  if (!content.file_url) {
    return new Response(JSON.stringify({ error: 'File URL missing' }), { status: 422 })
  }
  const fileUrl: string = content.file_url as string
  // Extract the key after the last '/'
  const key = fileUrl.substring(fileUrl.lastIndexOf('/') + 1)

  const downloadUrl = await generateDownloadUrl(key)

  return createSuccessResponse({ downloadUrl })
})
