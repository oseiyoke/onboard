import { getAuthenticatedUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function CurrentFlowPage() {
  const user = await getAuthenticatedUser()
  
  // For participants, redirect to main dashboard which shows all flows
  // The "current flow" concept is handled by the progress indicators
  if (user.role === 'participant') {
    redirect('/dashboard')
  }
  
  // For admins, redirect to flows management
  redirect('/dashboard/flows')
}

