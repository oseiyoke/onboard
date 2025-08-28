'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import * as Collapsible from '@radix-ui/react-collapsible'
import { 
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Play,
  FileText,
  Brain,
  Info,
  ArrowRight
} from 'lucide-react'
import { useFlowProgress, useProgressMutations, useProgressStats } from '@/hooks/use-progress'
import { UserFlowProgress } from '@/lib/services/progress.client'
import { cn } from '@/lib/utils'

interface StageProgressProps {
  enrollmentId: string
  onLaunchFlow?: () => void
}

function StageItemRow({ 
  item, 
  isSubmitting,
  submittingItemId,
  onToggleComplete 
}: {
  item: UserFlowProgress['stages'][0]['items'][0]
  isSubmitting: boolean
  submittingItemId: string | null
  onToggleComplete: (itemId: string, isCompleted: boolean, score?: number) => void
}) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'content': return FileText
      case 'assessment': return Brain
      case 'info': return Info
      default: return FileText
    }
  }

  const Icon = getItemIcon(item.item_type)
  const isCompleted = !!item.completed_at
  const isLoading = submittingItemId === item.item_id

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      isCompleted ? "bg-green-50 border-green-200" : "bg-background border-border hover:bg-muted/50",
      isLoading && "opacity-60"
    )}>
      <Checkbox
        checked={isCompleted}
        disabled={isSubmitting || isLoading}
        onCheckedChange={(checked) => 
          onToggleComplete(item.item_id, !checked, item.score || undefined)
        }
        className={cn(
          "transition-colors",
          isCompleted && "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600",
          isLoading && "animate-pulse"
        )}
      />
      
      <Icon className={cn(
        "w-4 h-4",
        isCompleted ? "text-green-600" : "text-muted-foreground"
      )} />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          isCompleted ? "text-green-900" : "text-foreground"
        )}>
          {item.item_title}
        </p>
        {item.item_type === 'assessment' && item.score && (
          <p className="text-xs text-green-600 mt-1">
            Score: {item.score}%
          </p>
        )}
      </div>
      
      {isLoading ? (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
          <Clock className="w-3 h-3 mr-1 animate-spin" />
          Saving...
        </Badge>
      ) : isCompleted ? (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Done
        </Badge>
      ) : null}
    </div>
  )
}

function StageCard({ 
  stage, 
  isSubmitting,
  submittingItemId,
  onToggleComplete 
}: {
  stage: UserFlowProgress['stages'][0]
  isSubmitting: boolean
  submittingItemId: string | null
  onToggleComplete: (itemId: string, isCompleted: boolean, score?: number) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const completedItems = stage.items.filter(item => item.completed_at).length
  const totalItems = stage.items.length
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  const isStageCompleted = !!stage.completed_at
  const isStageStarted = !!stage.started_at

  const getStageStatus = () => {
    if (isStageCompleted) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    }
    if (isStageStarted) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <Play className="w-3 h-3 mr-1" />
        Not Started
      </Badge>
    )
  }

  return (
    <Card className="transition-all">
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
        <Collapsible.Trigger className="w-full">
          <CardHeader className="hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div className="text-left">
                  <CardTitle className="text-lg">{stage.stage_title}</CardTitle>
                  <CardDescription>
                    {completedItems} of {totalItems} items completed
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStageStatus()}
              </div>
            </div>
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Collapsible.Trigger>
        
        <Collapsible.Content>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stage.items
                .sort((a, b) => a.item_position - b.item_position)
                .map((item) => (
                  <StageItemRow
                    key={item.item_id}
                    item={item}
                    isSubmitting={isSubmitting}
                    submittingItemId={submittingItemId}
                    onToggleComplete={onToggleComplete}
                  />
                ))}
            </div>
          </CardContent>
        </Collapsible.Content>
      </Collapsible.Root>
    </Card>
  )
}

function ProgressOverview({ stats }: { stats: ReturnType<typeof useProgressStats> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(262, 83%, 58%)' }}>
          <CheckCircle className="w-5 h-5" />
          Overall Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{stats.completionPercentage}%</span>
          <span className="text-muted-foreground">
            {stats.completedItems} of {stats.totalItems} items
          </span>
        </div>
        
        <Progress value={stats.completionPercentage} className="h-3" />
        
        {stats.nextIncompleteItem && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowRight className="w-4 h-4" />
            <span>
              Next: <span className="font-medium text-foreground">{stats.nextIncompleteItem.item_title}</span> 
              in {stats.nextIncompleteItem.stage_title}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
          <div className="h-3 bg-muted rounded w-full mt-4" />
        </CardHeader>
      </Card>
      
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-5 bg-muted rounded w-40" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
            <div className="h-2 bg-muted rounded w-full mt-3" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function StageProgress({ enrollmentId, onLaunchFlow }: StageProgressProps) {
  const { progress, loading, error } = useFlowProgress(enrollmentId)
  const { completeItem, isSubmitting, submittingItemId } = useProgressMutations(enrollmentId)
  const stats = useProgressStats(progress || null)

  const handleToggleComplete = async (itemId: string, isCompleted: boolean, score?: number) => {
    if (!isCompleted) {
      await completeItem(itemId, score)
    }
    // Note: We don't support uncompleting items
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error || !progress) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <div className="text-destructive text-sm">
            Failed to load progress data
          </div>
          <Button onClick={() => window.location.href = window.location.href} variant="outline">
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <ProgressOverview stats={stats} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onLaunchFlow && (
          <Button onClick={onLaunchFlow}>
            <Play className="w-4 h-4 mr-2" />
            {stats.completionPercentage > 0 ? 'Continue Learning' : 'Start Learning'}
          </Button>
        )}
        <Button variant="outline" onClick={() => window.location.href = window.location.href}>
          <Clock className="w-4 h-4 mr-2" />
          Refresh Progress
        </Button>
      </div>

      {/* Stages List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Stages & Tasks</h3>
        {progress.stages
          .sort((a, b) => a.stage_position - b.stage_position)
          .map((stage) => (
            <StageCard
              key={stage.stage_id}
              stage={stage}
              isSubmitting={isSubmitting}
              submittingItemId={submittingItemId}
              onToggleComplete={handleToggleComplete}
            />
          ))}
      </div>
    </div>
  )
}
