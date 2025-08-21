import { createClient } from '@/utils/supabase/server'
import { generateUploadUrl, generateFileKey } from '@/lib/r2-storage'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('onboard_users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admins can upload content
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { filename, contentType, size } = body

    if (!filename || !contentType || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file size (50MB limit)
    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large' }, { status: 400 })
    }

    // Validate content type
    const allowedTypes = [
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

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate file key and upload URL
    const fileKey = generateFileKey(userData.org_id, filename)
    const uploadUrl = await generateUploadUrl(fileKey, contentType)

    return NextResponse.json({
      uploadUrl,
      fileKey,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${fileKey}`
    })

  } catch (error) {
    console.error('Upload URL generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
