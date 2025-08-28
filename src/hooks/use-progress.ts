'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { clientProgressService, UserFlowProgress } from '@/lib/services/progress.client'
import { toast } from 'sonner'

// Hook for fetching detailed flow progress
export function useFlowProgress(enrollmentId: string | null) {
  const { data, error, isLoading, mutate: mutateProgress } = useSWR(
    enrollmentId ? `flow-progress-${enrollmentId}` : null,
    () => enrollmentId ? clientProgressService.getEnrollmentProgress(enrollmentId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests for 2 seconds
      refreshInterval: 0, // Disable automatic refresh
    }
  )

  return {
    progress: data,
    loading: isLoading,
    error,
    refreshProgress: mutateProgress,
  }
}

// Hook for progress mutations without optimistic updates
export function useProgressMutations(enrollmentId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null)

  const startStage = async (stageId: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await clientProgressService.startStage(stageId, enrollmentId)
      
      // Refresh progress data
      await mutate(`flow-progress-${enrollmentId}`)
      await mutate('participant-enrollments')
      
      toast.success('Stage started!')
    } catch (error) {
      console.error('Failed to start stage:', error)
      toast.error('Failed to start stage')
    } finally {
      setIsSubmitting(false)
    }
  }

  const completeItem = async (itemId: string, score?: number) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmittingItemId(itemId)
    try {
      // Make the actual API call
      await clientProgressService.completeStageItem(itemId, enrollmentId, score)
      
      // Fetch fresh data from the server
      await mutate(`flow-progress-${enrollmentId}`)
      await mutate('participant-enrollments')
      await mutate('available-flows') // Also update the available flows cache for completion status
      
      toast.success('Item completed!')
    } catch (error) {
      console.error('Failed to complete item:', error)
      toast.error('Failed to complete item')
    } finally {
      setIsSubmitting(false)
      setSubmittingItemId(null)
    }
  }

  const toggleItemComplete = async (itemId: string, isCompleted: boolean, score?: number) => {
    if (!isCompleted) {
      // If not completed, complete it
      await completeItem(itemId, score)
    }
    // Note: We don't support "uncompleting" items in this implementation
    // as it would require additional backend logic
  }

  return {
    startStage,
    completeItem,
    toggleItemComplete,
    isSubmitting,
    submittingItemId,
  }
}

// Hook for calculating progress statistics
export function useProgressStats(progress: UserFlowProgress | null) {
  if (!progress) {
    return {
      totalItems: 0,
      completedItems: 0,
      completionPercentage: 0,
      currentStage: null,
      nextIncompleteItem: null,
    }
  }

  const totalItems = progress.stages.reduce((acc, stage) => acc + stage.items.length, 0)
  const completedItems = progress.stages.reduce(
    (acc, stage) => acc + stage.items.filter(item => item.completed_at).length,
    0
  )
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // Find current stage (first incomplete stage, or last stage if all complete)
  const currentStage = progress.stages.find(stage => 
    stage.items.some(item => !item.completed_at)
  ) || progress.stages[progress.stages.length - 1]

  // Find next incomplete item
  let nextIncompleteItem = null
  for (const stage of progress.stages) {
    const incompleteItem = stage.items.find(item => !item.completed_at)
    if (incompleteItem) {
      nextIncompleteItem = {
        ...incompleteItem,
        stage_title: stage.stage_title,
        stage_id: stage.stage_id,
      }
      break
    }
  }

  return {
    totalItems,
    completedItems,
    completionPercentage,
    currentStage,
    nextIncompleteItem,
  }
}

