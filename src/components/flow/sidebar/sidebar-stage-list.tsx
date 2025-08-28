'use client'

import { Progress } from '@/components/ui/progress'
import { CheckCircle, FileText, Brain, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StageWithItems } from '@/lib/services/stage.service'
import { UserFlowProgress } from '@/lib/services/progress.service'

interface SidebarStageListProps {
  flowName: string
  stages: StageWithItems[]
  progress: UserFlowProgress
  overallProgress: number
  currentStageIndex: number
  activeItemIndex: number
  onStageChange: (stageIndex: number, itemIndex: number) => void
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'content': return FileText
    case 'assessment': return Brain
    case 'info': return Info
    default: return FileText
  }
}

export function SidebarStageList({
  flowName,
  stages,
  progress,
  overallProgress,
  currentStageIndex,
  activeItemIndex,
  onStageChange
}: SidebarStageListProps) {
  return (
    <div className="w-80 border-r bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="font-semibold text-lg truncate">{flowName}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={overallProgress} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {Math.round(overallProgress)}%
          </span>
        </div>
      </div>
      
      {/* Stages List */}
      <div className="p-4 space-y-3">
        {stages.map((stage, index) => {
          const stageProgress = progress.stages.find(s => s.stage_id === stage.id)
          const isCurrentStage = index === currentStageIndex
          const isCompleted = stageProgress?.completed_at
          const itemsCompleted = stageProgress?.items.filter(i => i.completed_at).length || 0
          
          return (
            <div
              key={stage.id}
              className={cn(
                "p-3 border rounded cursor-pointer transition-colors",
                isCurrentStage ? 'border-primary bg-primary/5' : 
                isCompleted ? 'border-green-500/50 bg-green-50' :
                'border-border hover:border-primary/50'
              )}
              onClick={() => onStageChange(index, 0)}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  isCompleted ? 'bg-green-600' : 
                  isCurrentStage ? 'bg-primary' : 
                  'bg-muted'
                )}>
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
                        className={cn(
                          "w-6 h-6 rounded flex items-center justify-center",
                          itemCompleted ? 'bg-green-600' :
                          isCurrentStage && itemIndex === activeItemIndex ? 'bg-primary' :
                          'bg-muted'
                        )}
                      >
                        <ItemIcon className={cn(
                          "w-3 h-3",
                          itemCompleted || (isCurrentStage && itemIndex === activeItemIndex) ? 
                          'text-white' : 'text-muted-foreground'
                        )} />
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
  )
}
