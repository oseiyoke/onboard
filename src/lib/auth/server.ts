import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'participant'
  firstName: string | null
  lastName: string | null
}

/**
 * Get authenticated user from server component context
 * Redirects to login if not authenticated
 * Redirects to onboard if not onboarded
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user role and names
  const { data: userData, error } = await supabase
    .from('onboard_users')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    redirect('/onboard')
  }

  return {
    id: user.id,
    email: user.email || '',
    role: userData.role,
    firstName: userData.first_name,
    lastName: userData.last_name,
  }
}

/**
 * Authenticate API request and return user data
 * Returns null if not authenticated
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Fetch user role and names
    const { data: userData, error } = await supabase
      .from('onboard_users')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: userData.role,
      firstName: userData.first_name,
      lastName: userData.last_name,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Require authentication for API routes
 * Throws appropriate HTTP responses if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await authenticateRequest(request)
  
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  return user
}

/**
 * Require admin role for API routes
 */
export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  if (user.role !== 'admin') {
    throw new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  return user
}

/**
 * Get user from session without redirects (for API routes)
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: userData, error } = await supabase
      .from('onboard_users')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: userData.role,
      firstName: userData.first_name,
      lastName: userData.last_name,
    }
  } catch {
    return null
  }
}
