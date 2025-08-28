'use client'

import { useState, useEffect, useCallback } from 'react'
import { StageWithItems } from '@/lib/services/stage.service'
import { UserFlowProgress } from '@/lib/services/progress.service'
import { useProgressMutations } from '@/hooks/use-progress'

interface UseFlowPlayerProps {
  stages: StageWithItems[]
  progress: UserFlowProgress
  enrollmentId: string
  onFlowComplete?: () => void
}

export function useFlowPlayer({
  stages,
  progress,
  enrollmentId,
  onFlowComplete
}: UseFlowPlayerProps) {
  const [previousProgress, setPreviousProgress] = useState(0)
  const [buttonLoading, setButtonLoading] = useState(false)
  const { completeItem } = useProgressMutations(enrollmentId)

  // Calculate initial position based on progress for seamless resume
  const getInitialPosition = useCallback(() => {
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex]
      const stageProgress = progress.stages.find(s => s.stage_id === stage.id)
      
      if (!stageProgress?.started_at) {
        return { stageIndex, itemIndex: 0 }
      }
      
      if (stageProgress.completed_at) {
        continue
      }
      
      // Stage started but not completed - find first incomplete item
      for (let itemIndex = 0; itemIndex < stage.items.length; itemIndex++) {
        const item = stage.items[itemIndex]
        const itemCompleted = stageProgress.items.find(i => i.item_id === item.id)?.completed_at
        
        if (!itemCompleted) {
          return { stageIndex, itemIndex }
        }
      }
      
      // All items completed but stage not marked complete - stay at last item
      return { stageIndex, itemIndex: Math.max(0, stage.items.length - 1) }
    }
    
    // All stages completed - go to last stage, last item
    const lastStageIndex = Math.max(0, stages.length - 1)
    const lastItemIndex = Math.max(0, stages[lastStageIndex]?.items.length - 1 || 0)
    return { stageIndex: lastStageIndex, itemIndex: lastItemIndex }
  }, [stages, progress])

  const initialPosition = getInitialPosition()
  const [currentStageIndex, setCurrentStageIndex] = useState(initialPosition.stageIndex)
  const [activeItemIndex, setActiveItemIndex] = useState(initialPosition.itemIndex)

  const currentStage = stages[currentStageIndex]
  const currentStageProgress = progress.stages.find(s => s.stage_id === currentStage?.id)

  // Calculate overall progress
  const totalItems = stages.reduce((acc, stage) => acc + stage.items.length, 0)
  const completedItems = progress.stages.reduce(
    (acc, stage) => acc + stage.items.filter(item => item.completed_at).length, 
    0
  )
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Check if flow just completed (reached 100%)
  useEffect(() => {
    if (overallProgress >= 100 && previousProgress < 100) {
      onFlowComplete?.()
    }
    setPreviousProgress(overallProgress)
  }, [overallProgress, previousProgress, onFlowComplete])

  // Navigation functions
  const canGoNext = useCallback(() => {
    if (!currentStage) return false
    
    if (activeItemIndex < currentStage.items.length - 1) return true
    if (currentStageIndex < stages.length - 1) return true
    return false
  }, [currentStage, activeItemIndex, currentStageIndex, stages.length])

  const canGoBack = useCallback(() => {
    if (activeItemIndex > 0) return true
    if (currentStageIndex > 0) return true
    return false
  }, [activeItemIndex, currentStageIndex])

  const goNext = useCallback(() => {
    if (!currentStage || !canGoNext()) return

    if (activeItemIndex < currentStage.items.length - 1) {
      setActiveItemIndex(activeItemIndex + 1)
    } else if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1)
      setActiveItemIndex(0)
    }
  }, [currentStage, activeItemIndex, currentStageIndex, stages.length, canGoNext])

  const goBack = useCallback(() => {
    if (!canGoBack()) return

    if (activeItemIndex > 0) {
      setActiveItemIndex(activeItemIndex - 1)
    } else if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1)
      setActiveItemIndex(stages[currentStageIndex - 1].items.length - 1)
    }
  }, [activeItemIndex, currentStageIndex, stages, canGoBack])

  const goToStage = useCallback((stageIndex: number, itemIndex: number = 0) => {
    if (stageIndex >= 0 && stageIndex < stages.length) {
      setCurrentStageIndex(stageIndex)
      const stage = stages[stageIndex]
      const maxItemIndex = Math.max(0, stage.items.length - 1)
      setActiveItemIndex(Math.min(itemIndex, maxItemIndex))
    }
  }, [stages])

  // Start current stage if not already started
  const handleStartStage = useCallback(async (stageId: string) => {
    try {
      const response = await fetch(`/api/progress/stages/${stageId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start stage')
      }
    } catch (error) {
      console.error('Failed to start stage:', error)
    }
  }, [enrollmentId])

  // Auto-start current stage
  useEffect(() => {
    if (currentStage && !currentStageProgress?.started_at) {
      handleStartStage(currentStage.id)
    }
  }, [currentStage?.id, currentStageProgress?.started_at, handleStartStage])

  // Complete item handler
  const handleCompleteItem = useCallback(async (itemId: string, score?: number) => {
    if (buttonLoading || !currentStage) return
    setButtonLoading(true)
    
    try {
      await completeItem(itemId, score)
      
      // Move to next item or stage after successful completion
      if (activeItemIndex < currentStage.items.length - 1) {
        setActiveItemIndex(activeItemIndex + 1)
      } else if (currentStageIndex < stages.length - 1) {
        setCurrentStageIndex(currentStageIndex + 1)
        setActiveItemIndex(0)
      }
      
      // Check if flow is complete for celebration
      const isFlowComplete = stages.every(stage => 
        stage.items.every(item => 
          item.id === itemId || progress?.stages
            .find(s => s.stage_id === stage.id)
            ?.items.find(i => i.item_id === item.id)
            ?.completed_at
        )
      )
      
      if (isFlowComplete) {
        onFlowComplete?.()
      }
    } catch (error) {
      console.error('Failed to complete item:', error)
    } finally {
      setButtonLoading(false)
    }
  }, [buttonLoading, currentStage, completeItem, activeItemIndex, currentStageIndex, stages, progress, onFlowComplete])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirm('Are you sure you want to exit? Your progress has been saved.')) {
          window.location.href = '/dashboard'
        }
        return
      }
      
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goBack])

  // Helper functions
  const isItemCompleted = useCallback((itemId: string) => {
    return currentStageProgress?.items.find(i => i.item_id === itemId)?.completed_at
  }, [currentStageProgress])

  return {
    // State
    currentStageIndex,
    activeItemIndex,
    currentStage,
    currentStageProgress,
    overallProgress,
    completedItems,
    totalItems,
    buttonLoading,

    // Navigation
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    goToStage,

    // Actions
    handleCompleteItem,
    isItemCompleted
  }
}
