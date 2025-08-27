'use client'

import { useState, useEffect } from 'react'
import { useAvailableFlows } from './use-flows'

export interface CompletionStatus {
  hasCompletedFlows: boolean
  totalFlows: number
  completedFlows: number
  completionPercentage: number
  loading: boolean
}

export function useCompletionStatus(): CompletionStatus {
  const { flows, loading } = useAvailableFlows()
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    hasCompletedFlows: false,
    totalFlows: 0,
    completedFlows: 0,
    completionPercentage: 0,
    loading: true
  })

  useEffect(() => {
    if (loading) return

    const totalFlows = flows.length
    const completedFlows = flows.filter(f => 
      f.enrollment?.completed_at || 
      (f.progress && f.progress.percentage >= 100)
    ).length

    const completionPercentage = totalFlows > 0 ? Math.round((completedFlows / totalFlows) * 100) : 0

    setCompletionStatus({
      hasCompletedFlows: completedFlows > 0,
      totalFlows,
      completedFlows,
      completionPercentage,
      loading: false
    })
  }, [flows, loading])

  return completionStatus
}
