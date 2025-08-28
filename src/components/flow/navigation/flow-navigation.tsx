'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, CheckCircle } from 'lucide-react'

interface FlowNavigationProps {
  flowName: string
  completedItems: number
  totalItems: number
  overallProgress: number
  onExit: () => void
}

export function FlowNavigation({
  flowName,
  completedItems,
  totalItems,
  overallProgress,
  onExit
}: FlowNavigationProps) {
  return (
    <div className="border-b bg-card px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onExit}
          >
            <ChevronLeft className="w-4 h-4" />
            Exit Learning
          </Button>
          <div className="text-sm text-muted-foreground">
            Dashboard / Learn / {flowName}
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
  )
}
