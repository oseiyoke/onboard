import { getAuthenticatedUser } from '@/lib/auth/server'
import { flowService } from '@/lib/services/flow.service'
import { stageService } from '@/lib/services/stage.service'
import { progressService } from '@/lib/services/progress.service'
import { notFound, redirect } from 'next/navigation'
import { FlowPlayer } from '@/components/flow/flow-player'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ enrollment?: string }>
}

export default async function LearnFlowPage({ params, searchParams }: PageProps) {
  const { id: flowId } = await params
  const { enrollment: enrollmentId } = await searchParams
  const user = await getAuthenticatedUser()
  
  if (!enrollmentId) {
    // For now, redirect to dashboard. Later we might create an enrollment flow.
    redirect('/dashboard')
  }
  
  // Fetch flow and stages
  const [flow, stages] = await Promise.all([
    flowService.getFlowById(flowId),
    stageService.getStagesByFlowId(flowId)
  ])
  
  if (!flow) {
    notFound()
  }
  
  // Fetch user progress for this enrollment
  const progress = await progressService.getUserFlowProgress(user.id, enrollmentId)
  
  if (!progress) {
    notFound()
  }
  
  return (
    <div className="-m-6">
      <FlowPlayer 
        flow={flow}
        stages={stages}
        progress={progress}
        enrollmentId={enrollmentId}
      />
    </div>
  )
}
