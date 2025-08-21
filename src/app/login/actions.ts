"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }
  redirect('/onboard')
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    return { error: error.message }
  }
  // on success, redirect (or wait for email confirm)
  redirect('/onboard')
}
