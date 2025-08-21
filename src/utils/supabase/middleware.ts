import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(
          name: string,
          value: string,
          options: Parameters<(typeof response.cookies)['set']>[0]
        ) {
          response.cookies.set({ name, value, ...options })
        },
        remove(
          name: string,
          options: Parameters<(typeof response.cookies)['set']>[0]
        ) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if needed. If this fails, user will be null.
  await supabase.auth.getUser()

  return response
}
