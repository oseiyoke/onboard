'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendReset(formData: FormData) {
  const email = String(formData.get('email'))
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  return { error: error?.message || null }
}
