'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  RotateCcw,
  Clock,
  CheckCircle,
  ChevronRight,
  Workflow
} from 'lucide-react'
import { useAvailableFlows, useFlowNavigation } from '@/hooks/use-flows'
import { ParticipantFlowPreview } from '@/lib/services/progress.client'
import { useState } from 'react'

function FlowCard({ flowPreview }: { flowPreview: ParticipantFlowPreview }) {
  const { launchFlowPreview } = useFlowNavigation()
  const [isLaunching, setIsLaunching] = useState(false)

  const getStatusBadge = (flowPreview: ParticipantFlowPreview) => {
    if (flowPreview.enrollment?.completed_at) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Completed
      </Badge>
    }
    if (flowPreview.progress && flowPreview.progress.percentage > 0) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        In Progress
      </Badge>
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      <Play className="w-3 h-3 mr-1" />
      Not Started
    </Badge>
  }

  const handleLaunch = async () => {
    setIsLaunching(true)
    try {
      await launchFlowPreview(flowPreview)
    } catch (error) {
      console.error('Failed to launch flow:', error)
      setIsLaunching(false)
    }
  }

  const getActionButton = (flowPreview: ParticipantFlowPreview) => {
    if (flowPreview.enrollment?.completed_at) {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLaunch}
          disabled={isLaunching}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Review
        </Button>
      )
    }
    if (flowPreview.progress && flowPreview.progress.percentage > 0) {
      return (
        <Button 
          size="sm"
          onClick={handleLaunch}
          disabled={isLaunching}
        >
          <Play className="w-4 h-4 mr-2" />
          Continue
        </Button>
      )
    }
    return (
      <Button 
        size="sm"
        onClick={handleLaunch}
        disabled={isLaunching}
      >
        <Play className="w-4 h-4 mr-2" />
        {isLaunching ? 'Starting...' : 'Start'}
      </Button>
    )
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{flowPreview.flow.name}</CardTitle>
            {flowPreview.flow.description && (
              <CardDescription className="line-clamp-2">
                {flowPreview.flow.description}
              </CardDescription>
            )}
          </div>
          {getStatusBadge(flowPreview)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{flowPreview.progress?.percentage || 0}%</span>
          </div>
          <Progress 
            value={flowPreview.progress?.percentage || 0} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {flowPreview.progress?.completed_items || 0} of {flowPreview.progress?.total_items || 0} items completed
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button 
            variant="ghost" 
            size="sm"
            disabled={!flowPreview.enrollment}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          {getActionButton(flowPreview)}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Workflow className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No Flows Assigned</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't been enrolled in any onboarding flows yet. 
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-8 bg-muted rounded" />
              </div>
              <div className="h-2 bg-muted rounded w-full" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="flex justify-between pt-2">
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-8 w-20 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ParticipantFlowsList() {
  const { flows, loading, error, refreshFlows } = useAvailableFlows()

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <div className="text-destructive text-sm">
            Failed to load flows: {error.message}
          </div>
          <Button onClick={() => refreshFlows()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!flows || flows.length === 0) {
    return <EmptyState />
  }

  // Separate flows by status for better organization
  const inProgressFlows = flows.filter(f => !f.enrollment?.completed_at && f.progress && f.progress.percentage > 0)
  const notStartedFlows = flows.filter(f => !f.enrollment?.completed_at && (!f.progress || f.progress.percentage === 0))
  const completedFlows = flows.filter(f => f.enrollment?.completed_at)

  return (
    <div className="space-y-8">
      {/* In Progress Flows */}
      {inProgressFlows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'hsl(262, 83%, 58%)' }}>
            <Clock className="w-5 h-5" />
            In Progress ({inProgressFlows.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inProgressFlows.map((flowPreview) => (
              <FlowCard key={flowPreview.flow.id} flowPreview={flowPreview} />
            ))}
          </div>
        </div>
      )}

      {/* Not Started Flows */}
      {notStartedFlows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'hsl(262, 83%, 58%)' }}>
            <Play className="w-5 h-5" />
            Ready to Start ({notStartedFlows.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notStartedFlows.map((flowPreview) => (
              <FlowCard key={flowPreview.flow.id} flowPreview={flowPreview} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Flows */}
      {completedFlows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'hsl(142, 76%, 36%)' }}>
            <CheckCircle className="w-5 h-5" />
            Completed ({completedFlows.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedFlows.map((flowPreview) => (
              <FlowCard key={flowPreview.flow.id} flowPreview={flowPreview} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

