'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { CompletionCelebration } from '@/components/celebration/completion-celebration'
import { 
  FileText, 
  Brain, 
  Info,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react'
import { StageWithItems } from '@/lib/services/stage.service'
import { UserFlowProgress } from '@/lib/services/progress.client'
import { useProgressMutations } from '@/hooks/use-progress'
import { ContentViewer } from '@/components/content/content-viewer'
import { AssessmentPlayer } from '@/components/assessment/assessment-player'
import { toast } from 'sonner'

interface FlowPlayerProps {
  flow: {
    id: string
    name: string
    description: string | null
  }
  stages: StageWithItems[]
  progress: UserFlowProgress
  enrollmentId: string
}

export function FlowPlayer({ flow, stages, progress, enrollmentId }: FlowPlayerProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [previousProgress, setPreviousProgress] = useState(0)
  const { completeItem } = useProgressMutations(enrollmentId)
  
  // Calculate initial position based on progress for seamless resume
  const getInitialPosition = () => {
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex]
      const stageProgress = progress.stages.find(s => s.stage_id === stage.id)
      
      if (!stageProgress?.started_at) {
        // Stage not started - start here
        return { stageIndex, itemIndex: 0 }
      }
      
      if (stageProgress.completed_at) {
        // Stage completed - continue to next stage
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
  }

  const initialPosition = getInitialPosition()
  const [currentStageIndex, setCurrentStageIndex] = useState(initialPosition.stageIndex)
  const [activeItemIndex, setActiveItemIndex] = useState(initialPosition.itemIndex)
  // Loading state for action buttons within FlowPlayer scope
  const [buttonLoading, setButtonLoading] = useState(false)
  
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
      setShowCelebration(true)
    }
    setPreviousProgress(overallProgress)
  }, [overallProgress, previousProgress])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit
      if (e.key === 'Escape') {
        if (confirm('Are you sure you want to exit? Your progress has been saved.')) {
          window.location.href = '/dashboard'
        }
        return
      }
      
      // Arrow keys for navigation (only if not in input/textarea)
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        // Go to previous item/stage
        if (activeItemIndex > 0) {
          setActiveItemIndex(activeItemIndex - 1)
        } else if (currentStageIndex > 0) {
          setCurrentStageIndex(currentStageIndex - 1)
          setActiveItemIndex(stages[currentStageIndex - 1].items.length - 1)
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        // Go to next item/stage
        if (activeItemIndex < currentStage.items.length - 1) {
          setActiveItemIndex(activeItemIndex + 1)
        } else if (currentStageIndex < stages.length - 1) {
          setCurrentStageIndex(currentStageIndex + 1)
          setActiveItemIndex(0)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStageIndex, activeItemIndex, stages, currentStage])

  const handleCompleteItem = async (itemId: string, score?: number) => {
    if (buttonLoading) return
    setButtonLoading(true)
    
    try {
      // Use the optimistic update from the hook
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
        setShowCelebration(true)
      }
    } catch (error) {
      console.error('Failed to complete item:', error)
      // Error handling is already done in the hook
    } finally {
      setButtonLoading(false)
    }
  }

  const handleStartStage = async (stageId: string) => {
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
      // Don't show error to user as this is not critical
    }
  }

  // Start current stage if not already started
  useEffect(() => {
    if (currentStage && !currentStageProgress?.started_at) {
      handleStartStage(currentStage.id)
    }
  }, [currentStage?.id, currentStageProgress?.started_at])

  if (!currentStage) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Flow Completed!</h2>
            <p className="text-muted-foreground">
              Congratulations on completing the learning flow.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isItemCompleted = (itemId: string) => {
    return currentStageProgress?.items.find(i => i.item_id === itemId)?.completed_at
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'content': return FileText
      case 'assessment': return Brain
      case 'info': return Info
      default: return FileText
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                // Simple exit for now - could add confirmation dialog later
                window.location.href = '/dashboard'
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Exit Learning
            </Button>
            <div className="text-sm text-muted-foreground">
              Dashboard / Learn / {flow.name}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Keyboard shortcuts hint */}
            <div className="text-xs text-muted-foreground hidden sm:block">
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">←→</kbd> Navigate • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> Exit
            </div>
            {/* Progress indicator */}
            <div className="text-sm text-muted-foreground">
              {completedItems} of {totalItems} items completed
            </div>
            <Badge variant="outline" className="gap-2">
              <CheckCircle className="w-3 h-3" />
              {Math.round(overallProgress)}%
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Stage Navigation */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="font-semibold text-lg truncate">{flow.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={overallProgress} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {stages.map((stage, index) => {
            const stageProgress = progress.stages.find(s => s.stage_id === stage.id)
            const isCurrentStage = index === currentStageIndex
            const isCompleted = stageProgress?.completed_at
            const itemsCompleted = stageProgress?.items.filter(i => i.completed_at).length || 0
            
            return (
              <div
                key={stage.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  isCurrentStage ? 'border-primary bg-primary/5' : 
                  isCompleted ? 'border-green-500/50 bg-green-50' :
                  'border-border hover:border-primary/50'
                }`}
                onClick={() => {
                  setCurrentStageIndex(index)
                  setActiveItemIndex(0)
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-600' : 
                    isCurrentStage ? 'bg-primary' : 
                    'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{stage.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {itemsCompleted} of {stage.items.length} completed
                    </p>
                  </div>
                </div>
                
                {stage.items.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {stage.items.map((item, itemIndex) => {
                      const ItemIcon = getItemIcon(item.type)
                      const itemCompleted = stageProgress?.items.find(i => i.item_id === item.id)?.completed_at
                      
                      return (
                        <div
                          key={item.id}
                          className={`w-6 h-6 rounded flex items-center justify-center ${
                            itemCompleted ? 'bg-green-600' :
                            isCurrentStage && itemIndex === activeItemIndex ? 'bg-primary' :
                            'bg-muted'
                          }`}
                        >
                          <ItemIcon className={`w-3 h-3 ${
                            itemCompleted || (isCurrentStage && itemIndex === activeItemIndex) ? 
                            'text-white' : 'text-muted-foreground'
                          }`} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Stage Header */}
        <div className="border-b bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{currentStage.title}</h2>
              {currentStage.description && (
                <p className="text-muted-foreground mt-1">{currentStage.description}</p>
              )}
            </div>
            {currentStage.image_url && (
              <img 
                src={currentStage.image_url} 
                alt={currentStage.title}
                className="w-16 h-16 object-cover rounded"
              />
            )}
          </div>
        </div>

        {/* Item Content */}
        <div className="flex-1 p-6">
          {currentStage.items.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Card>
                <CardContent className="text-center p-8">
                  <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Content</h3>
                  <p className="text-muted-foreground">
                    This stage doesn&apos;t have any content yet.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Tabs value={activeItemIndex.toString()} onValueChange={(value) => setActiveItemIndex(parseInt(value))}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${currentStage.items.length}, 1fr)` }}>
                {currentStage.items.map((item, index) => {
                  const ItemIcon = getItemIcon(item.type)
                  const completed = isItemCompleted(item.id)
                  
                  return (
                    <TabsTrigger key={item.id} value={index.toString()} className="gap-2">
                      <ItemIcon className="w-4 h-4" />
                      {item.title}
                      {completed && <CheckCircle className="w-3 h-3 text-green-600" />}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {currentStage.items.map((item, index) => (
                <TabsContent key={item.id} value={index.toString()} className="mt-6">
                  <ItemContent 
                    item={item} 
                    onComplete={(score) => handleCompleteItem(item.id, score)}
                    isCompleted={!!isItemCompleted(item.id)}
                    enrollmentId={enrollmentId}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="border-t bg-card p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (activeItemIndex > 0) {
                setActiveItemIndex(activeItemIndex - 1)
              } else if (currentStageIndex > 0) {
                setCurrentStageIndex(currentStageIndex - 1)
                setActiveItemIndex(stages[currentStageIndex - 1].items.length - 1)
              }
            }}
            disabled={currentStageIndex === 0 && activeItemIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={() => {
              if (activeItemIndex < currentStage.items.length - 1) {
                setActiveItemIndex(activeItemIndex + 1)
              } else if (currentStageIndex < stages.length - 1) {
                setCurrentStageIndex(currentStageIndex + 1)
                setActiveItemIndex(0)
              }
            }}
            disabled={
              currentStageIndex === stages.length - 1 && 
              activeItemIndex === currentStage.items.length - 1
            }
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      </div>
      
      {/* Completion Celebration */}
      <CompletionCelebration
        flowName={flow.name}
        show={showCelebration}
        onViewCertificate={() => {
          setShowCelebration(false)
          window.location.href = '/dashboard/certificate'
        }}
        onDismiss={() => setShowCelebration(false)}
      />
    </div>
  )
}

// Content fetcher component for content items
function ContentItemRenderer({ 
  contentId, 
  onComplete, 
  isCompleted 
}: { 
  contentId: string
  onComplete: (score?: number) => void
  isCompleted: boolean 
}) {
  const [content, setContent] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/content/${contentId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }
        const data = await response.json()
        setContent(data.content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchContent()
  }, [contentId])

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading content...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !content) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Failed to load content</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ContentViewer content={content as any} />
        <Separator className="my-4" />
        <div className="flex justify-end">
          {!isCompleted ? (
            <Button onClick={() => onComplete()} disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  Saving...
                </>
              ) : 'Mark as Complete'}
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-2">
              <CheckCircle className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Assessment fetcher component for assessment items
function AssessmentItemRenderer({ 
  assessmentId, 
  enrollmentId,
  onComplete, 
  isCompleted 
}: { 
  assessmentId: string
  enrollmentId: string
  onComplete: (score?: number) => void
  isCompleted: boolean 
}) {
  const [assessment, setAssessment] = useState<unknown>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [lastResult, setLastResult] = useState<unknown>(null)

  useEffect(() => {
    async function fetchAssessment() {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}?includeQuestions=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch assessment')
        }
        const data = await response.json()
        setAssessment(data.assessment as any)
        
        // Also check if there are previous attempts
        const attemptsResponse = await fetch(`/api/assessments/${assessmentId}/attempts`)
        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json()
          if (attemptsData.attempts && attemptsData.attempts.length > 0) {
            const lastAttempt = attemptsData.attempts[0] // Most recent attempt
            if (lastAttempt.completed_at) {
              setLastResult(lastAttempt as any)
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssessment()
  }, [assessmentId])

  const handleStartAssessment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create assessment attempt')
      }
      
      const data = await response.json()
      setAttemptId(data.attemptId)
      setShowPlayer(true)
    } catch (err) {
      toast.error('Failed to start assessment')
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssessmentComplete = async (answers: Record<string, unknown>, timeSpent: number) => {
    try {
      const response = await fetch(`/api/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          time_spent_seconds: timeSpent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit assessment')
      }

      const result = await response.json()
      setLastResult(result.attempt as any)
      setShowPlayer(false)
      
      // Calculate score as percentage
      const scorePercent = result.attempt.max_score && result.attempt.max_score > 0 
        ? (result.attempt.score / result.attempt.max_score) * 100 
        : 0
      const passed = scorePercent >= typedAssessment?.passing_score
      
      if (passed) {
        toast.success(`Assessment completed! Score: ${Math.round(scorePercent)}%`)
        onComplete(scorePercent)
      } else {
        toast.error(`Assessment failed. Score: ${Math.round(scorePercent)}%. Passing score: ${typedAssessment?.passing_score}%`)
      }
    } catch (error) {
      toast.error('Failed to submit assessment')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading assessment...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !assessment) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Failed to load assessment</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const typedAssessment = assessment as any
  const typedLastResult = lastResult as any

  if (showPlayer && attemptId) {
    return (
      <AssessmentPlayer 
        assessment={typedAssessment}
        attemptId={attemptId}
        onComplete={handleAssessmentComplete}
        onCancel={() => setShowPlayer(false)}
      />
    )
  }

  // Show assessment overview
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          {typedAssessment?.name}
        </CardTitle>
        {typedAssessment?.description && (
          <p className="text-muted-foreground">{typedAssessment.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Questions:</span>
            <span className="ml-2 font-medium">{typedAssessment?.questions?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Passing Score:</span>
            <span className="ml-2 font-medium">{typedAssessment?.passing_score}%</span>
          </div>
          {typedAssessment?.time_limit_seconds && (
            <div>
              <span className="text-muted-foreground">Time Limit:</span>
              <span className="ml-2 font-medium">{Math.floor(typedAssessment.time_limit_seconds / 60)} minutes</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Retries:</span>
            <span className="ml-2 font-medium">{typedAssessment?.retry_limit || 'Unlimited'}</span>
          </div>
        </div>

        {typedLastResult && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Previous Result</h4>
            <div className="text-sm space-y-1">
              <div>
                Score: <span className="font-medium">
                  {typedLastResult.max_score && typedLastResult.max_score > 0 
                    ? Math.round((typedLastResult.score / typedLastResult.max_score) * 100)
                    : 0}%
                </span>
              </div>
              <div className={`text-sm ${
                typedLastResult.max_score && typedLastResult.max_score > 0 && 
                (typedLastResult.score / typedLastResult.max_score) * 100 >= typedAssessment?.passing_score 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {typedLastResult.max_score && typedLastResult.max_score > 0 && 
                (typedLastResult.score / typedLastResult.max_score) * 100 >= typedAssessment?.passing_score 
                  ? 'Passed' 
                  : 'Failed'}
              </div>
            </div>
          </div>
        )}

        <Separator />
        <div className="flex justify-end">
          {isCompleted ? (
            <Badge variant="secondary" className="gap-2">
              <CheckCircle className="w-3 h-3" />
              Completed
            </Badge>
          ) : (
            <Button onClick={handleStartAssessment} className="gap-2">
              <Brain className="w-4 h-4" />
              {typedLastResult ? 'Retake Assessment' : 'Start Assessment'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Individual item content component
function ItemContent({ 
  item, 
  onComplete, 
  isCompleted,
  enrollmentId
}: { 
  item: unknown
  onComplete: (score?: number) => void
  isCompleted: boolean 
  enrollmentId: string
}) {
  const [buttonLoading, setButtonLoading] = useState(false)
  const handleMarkComplete = async () => {
    console.log("We dey mark am complete o")
    if (buttonLoading) return
    setButtonLoading(true)
    try {
      await onComplete()
    } finally {
      setButtonLoading(false)
    }
  }
  
  const typedItem = item as { 
    type: string; 
    title: string; 
    body?: string; 
    content_id?: string; 
    assessment_id?: string;
  }
  
  if (typedItem.type === 'info') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {typedItem.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{typedItem.body || 'No content available.'}</p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={handleMarkComplete} disabled={buttonLoading}>
                {buttonLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                    Saving...
                  </>
                ) : 'Mark as Complete'}
              </Button>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (typedItem.type === 'content') {
    // If we have a content_id, use the ContentItemRenderer
    if (typedItem.content_id) {
      return (
        <ContentItemRenderer 
          contentId={typedItem.content_id}
          onComplete={handleMarkComplete}
          isCompleted={isCompleted}
        />
      )
    }
    
    // Fallback for content items without content_id
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {typedItem.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No content linked to this item.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please configure content in the admin panel.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={handleMarkComplete} disabled={buttonLoading}>
                {buttonLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                    Saving...
                  </>
                ) : 'Mark as Complete'}
              </Button>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (typedItem.type === 'assessment') {
    // If we have an assessment_id, use the AssessmentItemRenderer
    if (typedItem.assessment_id) {
      return (
        <AssessmentItemRenderer 
          assessmentId={typedItem.assessment_id}
          enrollmentId={enrollmentId}
          onComplete={handleMarkComplete}
          isCompleted={isCompleted}
        />
      )
    }
    
    // Fallback for assessment items without assessment_id
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {typedItem.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No assessment linked to this item.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please configure assessment in the admin panel.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={handleMarkComplete} disabled={buttonLoading}>
                {buttonLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                    Saving...
                  </>
                ) : 'Mark as Complete'}
              </Button>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
