'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { CompletionCelebration } from '@/components/celebration/completion-celebration'
import { FlowNavigation } from './navigation/flow-navigation'
import { SidebarStageList } from './sidebar/sidebar-stage-list'
import { ContentArea } from './content/content-area'
import { NavigationFooter } from './navigation/navigation-footer'
import { useFlowPlayer } from '@/hooks/use-flow-player'
import { StageWithItems } from '@/lib/services/stage.service'
import { UserFlowProgress } from '@/lib/services/progress.client'

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

  const {
    currentStageIndex,
    activeItemIndex,
    currentStage,
    overallProgress,
    completedItems,
    totalItems,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    goToStage,
    handleCompleteItem,
    isItemCompleted
  } = useFlowPlayer({
    stages,
    progress,
    enrollmentId,
    onFlowComplete: () => setShowCelebration(true)
  })

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress has been saved.')) {
      window.location.href = '/dashboard'
    }
  }

  // Handle case where no current stage (flow completed)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <FlowNavigation
        flowName={flow.name}
        completedItems={completedItems}
        totalItems={totalItems}
        overallProgress={overallProgress}
        onExit={handleExit}
      />
      
      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Stage Navigation */}
        <SidebarStageList
          flowName={flow.name}
          stages={stages}
          progress={progress}
          overallProgress={overallProgress}
          currentStageIndex={currentStageIndex}
          activeItemIndex={activeItemIndex}
          onStageChange={goToStage}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <ContentArea
            currentStage={currentStage}
            activeItemIndex={activeItemIndex}
            onItemIndexChange={(index) => goToStage(currentStageIndex, index)}
            onCompleteItem={handleCompleteItem}
            isItemCompleted={(itemId) => !!isItemCompleted(itemId)}
            enrollmentId={enrollmentId}
          />

          {/* Navigation Footer */}
          <NavigationFooter
            canGoBack={canGoBack()}
            canGoNext={canGoNext()}
            onBack={goBack}
            onNext={goNext}
          />
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
