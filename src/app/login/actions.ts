"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type AuthFormState = {
  error?: string
}

export async function login(_prevState: AuthFormState | undefined, formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }

  // Check if user is already onboarded
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: onboardUser, error: onboardUserError } = await supabase
      .from('onboard_users')
      .select('id')
      .eq('id', user.id)
      .single()
      console.log("onboardUser", onboardUser)
      console.log("onboardUserError", onboardUserError)
    // Redirect based on onboarding status
    if (onboardUser) {
      redirect('/dashboard')
    } else {
      redirect('/onboard')
    }
  } else {
    redirect('/onboard')
  }
}

export async function signup(_prevState: AuthFormState | undefined, formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    return { error: error.message }
  }
  // on success, redirect (or wait for email confirm)
  redirect('/onboard')
}
