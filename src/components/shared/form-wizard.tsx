'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: ReactNode
}

interface FormWizardProps {
  steps: WizardStep[]
  currentStepId: string
  onStepChange: (stepId: string) => void
  children: ReactNode
  onNext?: () => void
  onBack?: () => void
  onCancel?: () => void
  canGoNext?: boolean
  canGoBack?: boolean
  isStepCompleted?: (stepId: string) => boolean
  isStepAccessible?: (stepId: string) => boolean
  nextLabel?: string
  backLabel?: string
  showProgress?: boolean
  className?: string
}

export function FormWizard({
  steps,
  currentStepId,
  onStepChange,
  children,
  onNext,
  onBack,
  onCancel,
  canGoNext = true,
  canGoBack = true,
  isStepCompleted = () => false,
  isStepAccessible = () => true,
  nextLabel,
  backLabel,
  showProgress = true,
  className
}: FormWizardProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStepId)
  const currentStep = steps[currentIndex]
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === steps.length - 1

  const progressPercentage = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0

  return (
    <div className={cn("min-h-screen bg-muted/30", className)}>
      <div className="max-w-7xl mx-auto flex gap-6 items-start p-6">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border border-border rounded-lg p-4 flex-shrink-0">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = currentStepId === step.id
              const isCompleted = isStepCompleted(step.id)
              const isAccessible = isStepAccessible(step.id)
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && onStepChange(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    'w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3',
                    isActive && 'bg-primary/10 border border-primary/20',
                    !isActive && isAccessible && 'hover:bg-muted/50',
                    !isAccessible && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/20 text-primary border border-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-medium text-sm flex items-center gap-2',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {step.title}
                      {step.icon && <span className="text-muted-foreground">{step.icon}</span>}
                    </div>
                    {step.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col h-[calc(100vh-6rem)]">
          {/* Progress Bar */}
          {showProgress && (
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{currentStep?.title}</h2>
                <Badge variant="outline">
                  Step {currentIndex + 1} of {steps.length}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {currentStep?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {currentStep.description}
                </p>
              )}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0 p-8">
            {children}
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-border bg-muted/50 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isFirstStep || !canGoBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel || `Back: ${!isFirstStep ? steps[currentIndex - 1]?.title : ''}`}
              </Button>

              <div className="flex gap-3">
                {onCancel && (
                  <Button onClick={onCancel} variant="outline">
                    Cancel
                  </Button>
                )}
                {!isLastStep && onNext && (
                  <Button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="gap-2"
                  >
                    {nextLabel || `Next: ${!isLastStep ? steps[currentIndex + 1]?.title : ''}`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
