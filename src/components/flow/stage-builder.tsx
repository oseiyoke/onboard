'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  Eye, 
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  ClipboardCheck,
  Info,
  Image as ImageIcon,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Flow } from '@/lib/services/flow.service'
import { StageWithItems, StageItem } from '@/lib/services/stage.service'
import { StageItemManager } from '@/components/flow/stage-item-manager'
import { StagePreview } from '@/components/flow/stage-preview'

interface StageBuilderProps {
  initialFlow: Flow
  stages: StageWithItems[]
  onCancel: () => void
  onSave?: (flowId: string) => void
}

type Step = 'flow-details' | string // 'flow-details' | 'stage-{stageId}' | 'preview'

interface StepConfig {
  id: Step
  title: string
  description: string
  icon?: React.ReactNode
  type: 'flow' | 'stage' | 'preview'
  stageId?: string
}

interface FlowData {
  title: string
  description: string
}

export function StageBuilder({ 
  initialFlow, 
  stages: initialStages,
  onCancel,
  onSave 
}: StageBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('flow-details')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())
  const [flowData, setFlowData] = useState<FlowData>({
    title: initialFlow.name || '',
    description: initialFlow.description || ''
  })
  const [stages, setStages] = useState<StageWithItems[]>(
    (initialStages || []).sort((a, b) => a.position - b.position)
  )
  const [isSaving, setIsSaving] = useState(false)

  // Generate steps dynamically based on stages
  const steps: StepConfig[] = [
    { 
      id: 'flow-details', 
      title: 'Flow Details', 
      description: 'Basic flow information',
      type: 'flow'
    },
    ...stages.map((stage, index) => ({
      id: `stage-${stage.id}`,
      title: stage.title || `Stage ${index + 1}`,
      description: `${stage.items?.length || 0} items`,
      type: 'stage' as const,
      stageId: stage.id,
      icon: <div className="flex gap-1">
        {stage.items?.some(item => item.type === 'content') && <FileText className="w-3 h-3" />}
        {stage.items?.some(item => item.type === 'assessment') && <ClipboardCheck className="w-3 h-3" />}
        {stage.items?.some(item => item.type === 'info') && <Info className="w-3 h-3" />}
      </div>
    })),
    { 
      id: 'preview', 
      title: 'Preview & Save', 
      description: 'Review and save your flow',
      type: 'preview',
      icon: <Eye className="w-4 h-4" />
    }
  ]

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep)
  }

  const isStepCompleted = (stepId: Step) => {
    if (stepId === 'flow-details') {
      return flowData.title?.trim() !== '' && flowData.description?.trim() !== ''
    }
    if (stepId.startsWith('stage-')) {
      const stageId = stepId.replace('stage-', '')
      const stage = stages.find(s => s.id === stageId)
      return stage && stage.title?.trim() !== '' && (stage.items?.length || 0) > 0
    }
    return completedSteps.has(stepId)
  }

  const isStepAccessible = (stepId: Step) => {
    const stepIndex = steps.findIndex(step => step.id === stepId)
    if (stepIndex === 0) return true
    
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepCompleted(steps[i].id)) {
        return false
      }
    }
    return true
  }

  const canGoNext = () => {
    const currentIndex = getCurrentStepIndex()
    return currentIndex < steps.length - 1 && isStepCompleted(currentStep)
  }

  const canGoBack = () => {
    return getCurrentStepIndex() > 0
  }

  const handleNext = () => {
    if (canGoNext()) {
      const currentIndex = getCurrentStepIndex()
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const handleBack = () => {
    if (canGoBack()) {
      const currentIndex = getCurrentStepIndex()
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleSaveFlow = async () => {
    setIsSaving(true)
    try {
      // Update flow details
      const flowUpdateResponse = await fetch(`/api/flows/${initialFlow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flowData.title,
          description: flowData.description,
        }),
      })

      if (!flowUpdateResponse.ok) {
        throw new Error('Failed to update flow details')
      }

      // Update stages
      await Promise.all(stages.map(async (stage) => {
        const response = await fetch(`/api/stages/${stage.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: stage.title,
            description: stage.description,
            image_url: stage.image_url ?? '',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update stage ${stage.title}`)
        }
      }))

      toast.success('Flow saved successfully!')
      onSave?.(initialFlow.id)
    } catch (error) {
      console.error('Save failed:', error)
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const addNewStage = useCallback(async () => {
    try {
      const response = await fetch(`/api/flows/${initialFlow.id}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New Stage ${stages.length + 1}`,
          description: '',
          position: stages.length,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create new stage')
      }

      const { stage } = await response.json()
      const newStage: StageWithItems = {
        ...stage,
        items: []
      }

      setStages(prev => [...prev, newStage])
      toast.success('New stage added!')
      
      // Navigate to the new stage
      setCurrentStep(`stage-${newStage.id}`)
    } catch (error) {
      console.error('Failed to add stage:', error)
      toast.error('Failed to add new stage')
    }
  }, [initialFlow.id, stages.length])

  const deleteStage = useCallback(async (stageId: string) => {
    try {
      const response = await fetch(`/api/stages/${stageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete stage')
      }

      setStages(prev => prev.filter(s => s.id !== stageId))
      
      // If we're currently viewing the deleted stage, navigate to flow details
      if (currentStep === `stage-${stageId}`) {
        setCurrentStep('flow-details')
      }

      toast.success('Stage deleted!')
    } catch (error) {
      console.error('Failed to delete stage:', error)
      toast.error('Failed to delete stage')
    }
  }, [currentStep])

  const updateStage = useCallback((stageId: string, updates: Partial<StageWithItems>) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ))
  }, [])

  const getCurrentStepContent = () => {
    const step = steps.find(s => s.id === currentStep)
    if (!step) return null

    switch (step.type) {
      case 'flow':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Flow Details</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Configure basic information about your learning flow
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flow-title">Flow Title</Label>
                <Input
                  id="flow-title"
                  value={flowData.title}
                  onChange={(e) => setFlowData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter flow title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="flow-description">Flow Description</Label>
                <Textarea
                  id="flow-description"
                  value={flowData.description}
                  onChange={(e) => setFlowData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what learners will achieve in this flow"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 'stage':
        const stage = stages.find(s => s.id === step.stageId)
        if (!stage) return <div>Stage not found</div>

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {stage.title || `Stage ${stages.findIndex(s => s.id === stage.id) + 1}`}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Configure this learning stage and its content items
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stage-title">Stage Title</Label>
                <Input
                  id="stage-title"
                  value={stage.title}
                  onChange={(e) => updateStage(stage.id, { title: e.target.value })}
                  placeholder="Enter stage title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stage-description">Stage Description</Label>
                <Textarea
                  id="stage-description"
                  value={stage.description || ''}
                  onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                  placeholder="Describe what learners will do in this stage"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage-image">Stage Image URL (optional)</Label>
                <Input
                  id="stage-image"
                  value={stage.image_url || ''}
                  onChange={(e) => updateStage(stage.id, { image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <StageItemManager
              stage={stage}
              onUpdateStage={(updates: Partial<StageWithItems>) => updateStage(stage.id, updates)}
            />
          </div>
        )

      case 'preview':
        return (
          <StagePreview
            flow={{ ...initialFlow, ...flowData }}
            stages={stages}
          />
        )

      default:
        return <div>Unknown step type</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border flex-shrink-0 min-h-screen">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Flow Builder
            </h3>
          </div>
          
          <div className="p-4 space-y-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = isStepCompleted(step.id)
              const isAccessible = isStepAccessible(step.id)
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && setCurrentStep(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    'w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3',
                    isActive && 'bg-primary/5 border border-primary/20 dark:bg-primary/10 dark:border-primary/30',
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
                        ? 'bg-primary/10 text-primary border border-primary/30 dark:bg-primary/20 dark:text-primary dark:border-primary/40'
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
                      isActive ? 'text-primary dark:text-primary' : 'text-foreground'
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
                  {step.type === 'stage' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (step.stageId) deleteStage(step.stageId)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </button>
              )
            })}
            
            {/* Add Stage Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={addNewStage}
              className="w-full gap-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              Add Stage
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Content Area */}
          <div className="flex-1 p-8">
            {getCurrentStepContent()}
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={!canGoBack()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back: {canGoBack() ? steps[getCurrentStepIndex() - 1]?.title : ''}
              </Button>

              <div className="flex gap-3">
                {currentStep === 'preview' ? (
                  <>
                    <Button 
                      onClick={onCancel}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveFlow}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Flow'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="gap-2"
                  >
                    Next: {canGoNext() ? steps[getCurrentStepIndex() + 1]?.title : ''}
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
