import { getAuthenticatedUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { UsersPageClient } from './users-page-client'

export default async function UsersPage() {
  const user = await getAuthenticatedUser()
  
  // Only admins can access user management
  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  return <UsersPageClient />
}
