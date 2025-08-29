'use client'

import { useState, useCallback, useMemo } from 'react'

export interface NavigationStep {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
}

interface UseStepNavigationProps {
  steps: NavigationStep[]
  initialStep?: string
  onStepChange?: (stepId: string, previousStepId: string) => void
  validation?: Record<string, () => boolean | string>
}

export function useStepNavigation({
  steps,
  initialStep,
  onStepChange,
  validation = {}
}: UseStepNavigationProps) {
  const [currentStepId, setCurrentStepId] = useState<string>(
    initialStep || steps[0]?.id || ''
  )
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  const currentIndex = useMemo(
    () => steps.findIndex(step => step.id === currentStepId),
    [steps, currentStepId]
  )

  const currentStep = useMemo(
    () => steps[currentIndex],
    [steps, currentIndex]
  )

  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === steps.length - 1

  const validateStep = useCallback((stepId: string): boolean => {
    const validator = validation[stepId]
    if (!validator) return true

    const result = validator()
    if (typeof result === 'string') {
      setStepErrors(prev => ({ ...prev, [stepId]: result }))
      return false
    }

    setStepErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[stepId]
      return newErrors
    })
    return result
  }, [validation])

  // Side-effect-free validation check (does NOT update state)
  const isStepValid = useCallback((stepId: string): boolean => {
    const validator = validation[stepId]
    if (!validator) return true

    const result = validator()
    return typeof result === 'string' ? false : result
  }, [validation])

  const isStepCompleted = useCallback((stepId: string): boolean => {
    return completedSteps.has(stepId)
  }, [completedSteps])

  const isStepAccessible = useCallback((stepId: string): boolean => {
    const stepIndex = steps.findIndex(step => step.id === stepId)
    if (stepIndex <= currentIndex) return true

    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(steps[i].id)) {
        return false
      }
    }
    return true
  }, [steps, currentIndex, completedSteps])

  const canGoNext = useCallback((): boolean => {
    if (isLastStep) return false
    return isStepValid(currentStepId)
  }, [isLastStep, isStepValid, currentStepId])

  const canGoBack = useCallback((): boolean => {
    return !isFirstStep
  }, [isFirstStep])

  const goToStep = useCallback((stepId: string): boolean => {
    if (!isStepAccessible(stepId)) return false

    const previousStepId = currentStepId
    setCurrentStepId(stepId)
    onStepChange?.(stepId, previousStepId)
    return true
  }, [isStepAccessible, currentStepId, onStepChange])

  const goNext = useCallback((): boolean => {
    if (!canGoNext()) return false

    const nextStep = steps[currentIndex + 1]
    if (!nextStep) return false

    // Mark current step as completed if validation passes
    if (validateStep(currentStepId)) {
      setCompletedSteps(prev => new Set([...prev, currentStepId]))
    }

    return goToStep(nextStep.id)
  }, [canGoNext, steps, currentIndex, validateStep, currentStepId, goToStep])

  const goBack = useCallback((): boolean => {
    if (!canGoBack()) return false

    const prevStep = steps[currentIndex - 1]
    if (!prevStep) return false

    return goToStep(prevStep.id)
  }, [canGoBack, steps, currentIndex, goToStep])

  const markStepCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]))
  }, [])

  const markStepIncomplete = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev)
      newSet.delete(stepId)
      return newSet
    })
  }, [])

  const resetNavigation = useCallback((newInitialStep?: string) => {
    const resetStep = newInitialStep || steps[0]?.id || ''
    setCurrentStepId(resetStep)
    setCompletedSteps(new Set())
    setStepErrors({})
  }, [steps])

  const getStepError = useCallback((stepId: string): string | undefined => {
    return stepErrors[stepId]
  }, [stepErrors])

  return {
    // State
    currentStepId,
    currentStep,
    currentIndex,
    completedSteps,
    stepErrors,

    // Computed values
    isFirstStep,
    isLastStep,

    // Validation
    isStepCompleted,
    isStepAccessible,
    canGoNext,
    canGoBack,
    validateStep,
    getStepError,

    // Navigation
    goToStep,
    goNext,
    goBack,

    // Manual control
    markStepCompleted,
    markStepIncomplete,
    resetNavigation,
  }
}
