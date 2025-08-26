'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText,
  ClipboardCheck,
  Info,
  Play,
  Clock,
  Users,
  Target,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Flow } from '@/lib/services/flow.service'
import { StageWithItems, StageItem } from '@/lib/services/stage.service'

interface StagePreviewProps {
  flow: Flow
  stages: StageWithItems[]
}

const ITEM_TYPES = [
  { 
    value: 'content', 
    label: 'Content', 
    icon: FileText, 
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
  },
  { 
    value: 'assessment', 
    label: 'Assessment', 
    icon: ClipboardCheck, 
    color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
  },
  { 
    value: 'info', 
    label: 'Info', 
    icon: Info, 
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
  },
] as const

function StageItemPreview({ item }: { item: StageItem }) {
  const typeConfig = ITEM_TYPES.find(t => t.value === item.type) || ITEM_TYPES[0]
  const Icon = typeConfig.icon

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Badge variant="outline" className={cn("gap-1", typeConfig.color)}>
        <Icon className="w-3 h-3" />
        {typeConfig.label}
      </Badge>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{item.title}</div>
        {item.body && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {item.body}
          </div>
        )}
      </div>
    </div>
  )
}

function StageCard({ stage, index }: { stage: StageWithItems; index: number }) {
  const items = stage.items || []
  const contentCount = items.filter(item => item.type === 'content').length
  const assessmentCount = items.filter(item => item.type === 'assessment').length
  const infoCount = items.filter(item => item.type === 'info').length

  return (
    <Card className="relative overflow-hidden">
      {/* Stage Image */}
      {stage.image_url && (
        <div className="h-32 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800 flex items-center justify-center">
          <img 
            src={stage.image_url} 
            alt={stage.title}
            className="max-h-full max-w-full object-cover rounded-t-lg"
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <CardTitle className="text-lg">{stage.title}</CardTitle>
            </div>
            {stage.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {stage.description}
              </p>
            )}
          </div>
        </div>

        {/* Item Type Summary */}
        <div className="flex items-center gap-2 pt-2">
          {contentCount > 0 && (
            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
              <FileText className="w-3 h-3" />
              {contentCount}
            </Badge>
          )}
          {assessmentCount > 0 && (
            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
              <ClipboardCheck className="w-3 h-3" />
              {assessmentCount}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
              <Info className="w-3 h-3" />
              {infoCount}
            </Badge>
          )}
          {items.length === 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              No items
            </Badge>
          )}
        </div>
      </CardHeader>

      {items.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Items ({items.length})
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {items.slice(0, 3).map(item => (
                <StageItemPreview key={item.id} item={item} />
              ))}
              {items.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{items.length - 3} more items
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}

      {/* Connection Arrow */}
      {index < 999 && ( // Will be handled by parent component
        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background border rounded-full p-1">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  )
}

export function StagePreview({ flow, stages }: StagePreviewProps) {
  const sortedStages = [...stages].sort((a, b) => a.position - b.position)
  const totalItems = sortedStages.reduce((sum, stage) => sum + (stage.items?.length || 0), 0)
  const totalAssessments = sortedStages.reduce((sum, stage) => 
    sum + (stage.items?.filter(item => item.type === 'assessment').length || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Flow Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{flow.name}</h1>
          {flow.description && (
            <p className="text-muted-foreground mt-2">{flow.description}</p>
          )}
        </div>

        {/* Flow Stats */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>{sortedStages.length} Stages</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{totalItems} Items</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardCheck className="w-4 h-4" />
            <span>{totalAssessments} Assessments</span>
          </div>
        </div>

        {/* Preview Action */}
        <Button className="gap-2">
          <Play className="w-4 h-4" />
          Test Flow
        </Button>
      </div>

      {/* Stages Flow */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Learning Path</h2>
        
        {sortedStages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No stages yet. Add stages to create your learning path.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Start Node */}
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800 flex items-center justify-center">
                <Play className="w-6 h-6 text-violet-700 dark:text-violet-300" />
              </div>
              <div className="ml-4">
                <div className="font-medium">Start</div>
                <div className="text-sm text-muted-foreground">Begin learning journey</div>
              </div>
              <div className="ml-auto">
                <div className="w-8 h-px bg-border"></div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-2 ml-2" />
              </div>
            </div>

            {/* Stages Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedStages.map((stage, index) => (
                <div key={stage.id} className="relative">
                  <StageCard stage={stage} index={index} />
                  {index < sortedStages.length - 1 && (
                    <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
                      <div className="bg-background border rounded-full p-1">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Completion Node */}
            <div className="flex items-center mt-6">
              <div className="w-8 h-px bg-border"></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground mr-2" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center ml-4">
                <Target className="w-6 h-6 text-green-700 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <div className="font-medium">Complete</div>
                <div className="text-sm text-muted-foreground">Learning journey finished</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Validation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Flow has title and description</span>
            <Badge variant={flow.name && flow.description ? "default" : "destructive"}>
              {flow.name && flow.description ? "✓" : "✗"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Has at least one stage</span>
            <Badge variant={sortedStages.length > 0 ? "default" : "destructive"}>
              {sortedStages.length > 0 ? "✓" : "✗"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>All stages have titles</span>
            <Badge variant={sortedStages.every(stage => stage.title?.trim()) ? "default" : "destructive"}>
              {sortedStages.every(stage => stage.title?.trim()) ? "✓" : "✗"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>All stages have at least one item</span>
            <Badge variant={sortedStages.every(stage => (stage.items?.length || 0) > 0) ? "default" : "secondary"}>
              {sortedStages.every(stage => (stage.items?.length || 0) > 0) ? "✓" : "⚠"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
