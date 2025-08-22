import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is onboarded
    const { data: onboardUser, error: onboardError } = await supabase
      .from('onboard_users')
      .select('role, first_name, last_name, created_at')
      .eq('id', user.id)
      .single()
    
    const isOnboarded = onboardUser && onboardUser.first_name && onboardUser.last_name

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: onboardUser?.role || null,
        firstName: onboardUser?.first_name || null,
        lastName: onboardUser?.last_name || null,
        createdAt: onboardUser?.created_at || null,
        isOnboarded
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
