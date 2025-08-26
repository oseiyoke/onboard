'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Brain, 
  Info,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Play
} from 'lucide-react'
import { StageWithItems } from '@/lib/services/stage.service'
import { UserFlowProgress } from '@/lib/services/progress.service'
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
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  
  const currentStage = stages[currentStageIndex]
  const currentStageProgress = progress.stages.find(s => s.stage_id === currentStage?.id)
  const currentItem = currentStage?.items[activeItemIndex]

  // Calculate overall progress
  const totalItems = stages.reduce((acc, stage) => acc + stage.items.length, 0)
  const completedItems = progress.stages.reduce(
    (acc, stage) => acc + stage.items.filter(item => item.completed_at).length, 
    0
  )
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  const handleCompleteItem = async (itemId: string, score?: number) => {
    try {
      const response = await fetch(`/api/progress/stage-items/${itemId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          score: score || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark item as complete')
      }

      toast.success('Item completed!')
      
      // Move to next item or stage
      if (activeItemIndex < currentStage.items.length - 1) {
        setActiveItemIndex(activeItemIndex + 1)
      } else if (currentStageIndex < stages.length - 1) {
        setCurrentStageIndex(currentStageIndex + 1)
        setActiveItemIndex(0)
      }
      
      // Refresh the page to update progress
      window.location.reload()
    } catch (error) {
      toast.error('Failed to complete item')
      console.error(error)
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
  }, [currentStage?.id])

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
    <div className="h-screen flex bg-background">
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
            const isStarted = stageProgress?.started_at
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
                    This stage doesn't have any content yet.
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
  )
}

// Individual item content component
function ItemContent({ 
  item, 
  onComplete, 
  isCompleted 
}: { 
  item: any
  onComplete: (score?: number) => void
  isCompleted: boolean 
}) {
  if (item.type === 'info') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{item.body || 'No content available.'}</p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={() => onComplete()}>
                Mark as Complete
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

  if (item.type === 'content') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Content viewer will be implemented here.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This will integrate with the existing ContentViewer component.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={() => onComplete()}>
                Mark as Complete
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

  if (item.type === 'assessment') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Assessment player will be implemented here.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This will integrate with the existing AssessmentPlayer component.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={() => onComplete(85)}>
                Complete Assessment
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
