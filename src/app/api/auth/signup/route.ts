import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = SignupSchema.parse(body)
    
    const supabase = await createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      return Response.json({ error: signUpError.message }, { status: 400 })
    }

    // If email confirmation is disabled the user will already have a session.
    // Otherwise, immediately sign them in so we always have a valid session.
    if (!signUpData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        return Response.json({ error: signInError.message }, { status: 400 })
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Account created successfully',
      user: signUpData.user 
    })
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
