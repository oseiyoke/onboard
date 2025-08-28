'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { clientProgressService, ParticipantEnrollment, ParticipantFlowPreview } from '@/lib/services/progress.client'
import React from 'react'

// Hook for fetching participant enrollments (flows they're enrolled in)
export function useParticipantFlows() {
  const { data, error, isLoading, mutate } = useSWR(
    'participant-enrollments',
    () => clientProgressService.getParticipantEnrollments(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Disabled - rely on manual revalidation
      dedupingInterval: 5000, // Prevent duplicate requests for 5 seconds
    }
  )

  const memoizedFlows = React.useMemo(() => data ?? [], [data])

  return {
    flows: memoizedFlows,
    loading: isLoading,
    error,
    refreshFlows: mutate,
  }
}

// Hook for fetching all available flows (enrolled and not enrolled)
export function useAvailableFlows() {
  const { data, error, isLoading, mutate } = useSWR(
    'available-flows',
    () => clientProgressService.getAvailableFlows(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Disabled - rely on manual revalidation
      dedupingInterval: 5000, // Prevent duplicate requests for 5 seconds
    }
  )

  const memoizedFlows = React.useMemo(() => data ?? [], [data])

  return {
    flows: memoizedFlows,
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
    const url = `/dashboard/learn/flows/${enrollment.flow_id}?enrollment=${enrollment.id}`
    window.location.href = url
  }

  // New method for launching flows that may not have enrollment yet
  const launchFlowPreview = async (flowPreview: ParticipantFlowPreview) => {
    let enrollmentId = flowPreview.enrollment?.id
    
    // If no enrollment exists, create one
    if (!enrollmentId) {
      try {
        enrollmentId = await clientProgressService.createEnrollment(flowPreview.flow.id)
      } catch (error) {
        console.error('Failed to create enrollment:', error)
        throw error
      }
    }
    
    // Navigate to learn flow page with enrollment ID
    const url = `/dashboard/learn/flows/${flowPreview.flow.id}?enrollment=${enrollmentId}`
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
    launchFlowPreview,
    viewFlowDetails,
    closeFlowDetails,
  }
}

