import { getAuthenticatedUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { ContentPageClient } from '@/app/dashboard/content/content-page-client'

export default async function ContentPage() {
  const user = await getAuthenticatedUser()
  
  // Check if user is admin or member
  if (!user.member) {
    redirect('/dashboard')
  }

  return <ContentPageClient userRole={user.role} />
}
