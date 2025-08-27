'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { clientProgressService, ParticipantEnrollment } from '@/lib/services/progress.client'

// Hook for fetching participant enrollments (flows they're enrolled in)
export function useParticipantFlows() {
  const { data, error, isLoading, mutate } = useSWR(
    'participant-enrollments',
    () => clientProgressService.getParticipantEnrollments(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  return {
    flows: data || [],
    loading: isLoading,
    error,
    refreshFlows: mutate,
  }
}

// Hook for managing flow navigation and launch
export function useFlowNavigation() {
  const [selectedFlow, setSelectedFlow] = useState<ParticipantEnrollment | null>(null)

  const launchFlow = (enrollment: ParticipantEnrollment) => {
    // Navigate to learn flow page with enrollment ID
    const url = `/learn/flows/${enrollment.flow_id}?enrollment=${enrollment.id}`
    window.location.href = url
  }

  const viewFlowDetails = (enrollment: ParticipantEnrollment) => {
    setSelectedFlow(enrollment)
  }

  const closeFlowDetails = () => {
    setSelectedFlow(null)
  }

  return {
    selectedFlow,
    launchFlow,
    viewFlowDetails,
    closeFlowDetails,
  }
}

