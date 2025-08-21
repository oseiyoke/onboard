import { createClient } from '@/utils/supabase/server'
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

    // Only admins can create content records
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, fileUrl, fileSize, metadata = {} } = body

    if (!name || !type || !fileUrl || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create content record in database
    const { data: content, error: contentError } = await supabase
      .from('onboard_content')
      .insert({
        org_id: userData.org_id,
        name,
        type,
        file_url: fileUrl,
        file_size: fileSize,
        metadata,
        created_by: user.id,
      })
      .select()
      .single()

    if (contentError) {
      console.error('Content creation error:', contentError)
      return NextResponse.json({ error: 'Failed to create content record' }, { status: 500 })
    }

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Content API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch content for the organization
    const { data: content, error: contentError } = await supabase
      .from('onboard_content')
      .select('*')
      .eq('org_id', userData.org_id)
      .order('created_at', { ascending: false })

    if (contentError) {
      console.error('Content fetch error:', contentError)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Content API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
