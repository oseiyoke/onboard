"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { randomUUID } from 'crypto'

export async function createFlow(formData: FormData) {
  const name = String(formData.get('name'))
  const description = String(formData.get('description')) || null
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get user's organization
  const { data: onboardUser, error: userError } = await supabase
    .from('onboard_users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (userError || !onboardUser) {
    return { error: 'User not found or not onboarded' }
  }

  if (onboardUser.role !== 'admin') {
    return { error: 'Only administrators can create flows' }
  }

  if (!name.trim()) {
    return { error: 'Flow name is required' }
  }

  try {
    const flowId = randomUUID()
    const { data, error } = await supabase
      .from('onboard_flows')
      .insert({
        id: flowId,
        org_id: onboardUser.org_id,
        name: name.trim(),
        description,
        flow_data: {
          nodes: [
            {
              id: 'start',
              type: 'start',
              position: { x: 250, y: 50 },
              data: { label: 'Start' }
            }
          ],
          edges: []
        },
        is_active: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Flow creation error:', error)
      return { error: 'Failed to create flow' }
    }

    // Redirect to the flow editor
    redirect(`/dashboard/flows/${data.id}/edit`)
  } catch (error) {
    console.error('Flow creation error:', error)
    return { error: 'An error occurred while creating the flow' }
  }
}