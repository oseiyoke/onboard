'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  current: number
  total: number
  completed?: number
  label?: string
  showPercentage?: boolean
  showCounts?: boolean
  showTimeRemaining?: boolean
  timeRemaining?: number
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function ProgressIndicator({
  current,
  total,
  completed = 0,
  label,
  showPercentage = true,
  showCounts = true,
  showTimeRemaining = false,
  timeRemaining,
  variant = 'default',
  className
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Progress value={percentage} className="flex-1 h-2" />
        {showPercentage && (
          <Badge variant="outline" className="text-xs">
            {percentage}%
          </Badge>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-3", className)}>
        {label && (
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{label}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {showCounts && (
                <span>{current} of {total}</span>
              )}
              {showTimeRemaining && timeRemaining && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(timeRemaining)} remaining</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Progress value={percentage} className="h-3" />
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {showPercentage && (
                <Badge variant="outline">
                  {percentage}% Progress
                </Badge>
              )}
              {completed > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {completed} Completed
                </Badge>
              )}
            </div>
            
            {showCounts && (
              <span className="text-muted-foreground">
                {current} / {total} items
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2">
            {showCounts && (
              <span className="text-sm text-muted-foreground">
                {current} of {total}
              </span>
            )}
            {showPercentage && (
              <Badge variant="outline">
                {percentage}%
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <Progress value={percentage} className="w-full" />
      
      {(showTimeRemaining && timeRemaining) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatTime(timeRemaining)} remaining</span>
        </div>
      )}
    </div>
  )
}
