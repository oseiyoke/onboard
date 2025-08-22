import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()
    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
