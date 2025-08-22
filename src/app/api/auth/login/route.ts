import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)
    
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Check if user is already onboarded
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: onboardUser, error: onboardUserError } = await supabase
        .from('onboard_users')
        .select('id, role, first_name, last_name')
        .eq('id', user.id)
        .single()
      
      const isOnboarded = onboardUser && onboardUser.first_name && onboardUser.last_name
      
      return Response.json({ 
        success: true, 
        message: 'Login successful',
        user: user,
        isOnboarded,
        redirectTo: isOnboarded ? '/dashboard' : '/onboard'
      })
    }

    return Response.json({ 
      success: true, 
      message: 'Login successful',
      redirectTo: '/onboard'
    })
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
