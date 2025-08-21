import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orgName, orgSlug, firstName, lastName, role } = body

    if (!orgName || !orgSlug || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if organization slug is already taken
    const { data: existingOrg } = await supabase
      .from('onboard_organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()

    if (existingOrg) {
      return NextResponse.json({ error: 'Organization URL is already taken' }, { status: 400 })
    }

    // Check if user is already onboarded
    const { data: existingUser } = await supabase
      .from('onboard_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User is already onboarded' }, { status: 400 })
    }

    // Create organization
    const orgId = randomUUID()
    const { error: orgInsertError } = await supabase
      .from('onboard_organizations')
      .insert({
        id: orgId,
        name: orgName,
        slug: orgSlug,
        settings: {}
      })

    if (orgInsertError) {
      console.error('Organization creation error:', orgInsertError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Create user profile
    const { error: userError } = await supabase
      .from('onboard_users')
      .insert({
        id: user.id,
        org_id: orgId,
        email: user.email || '',
        role: role,
        first_name: firstName,
        last_name: lastName
      })

    if (userError) {
      console.error('User creation error:', userError)
      // Clean up the organization if user creation fails
      await supabase
        .from('onboard_organizations')
        .delete()
        .eq('id', orgId)
      
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // Fetch organization now that user profile exists (SELECT policy will pass)
    const { data: org, error: orgFetchError } = await supabase
      .from('onboard_organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgFetchError) {
      console.error('Organization fetch error:', orgFetchError)
      return NextResponse.json({ error: 'Failed to fetch organization after creation' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      organization: org
    })

  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
