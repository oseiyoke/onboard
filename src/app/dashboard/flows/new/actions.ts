"use server"

import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { flowService } from '@/lib/services/flow.service'
import { revalidatePath } from 'next/cache'

export async function createFlow(formData: FormData) {
  try {
    // Get authenticated user (will redirect if not authenticated/onboarded)
    const user = await getAuthenticatedUser()

    // Check if user is admin
    if (user.role !== 'admin') {
      return { error: 'Only administrators can create flows' }
    }

    const name = String(formData.get('name')).trim()
    const description = String(formData.get('description')).trim() || undefined

    if (!name) {
      return { error: 'Flow name is required' }
    }

    // Create flow using service
    const flow = await flowService.createFlow(user.orgId, user.id, {
      name,
      description,
    })

    // Revalidate the flows list page
    revalidatePath('/dashboard/flows')

    // Redirect to the flow editor
    redirect(`/dashboard/flows/${flow.id}/edit`)
  } catch (error) {
    console.error('Flow creation error:', error)
    return { error: 'Failed to create flow' }
  }
}