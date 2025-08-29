import { getAuthenticatedUser } from '@/lib/auth/server'
import { flowService } from '@/lib/services/flow.service'
import { stageService } from '@/lib/services/stage.service'
import { notFound } from 'next/navigation'
import { FlowViewClient } from '@/components/flow/flow-view-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FlowViewPage({ params }: PageProps) {
  const { id: flowId } = await params
  const user = await getAuthenticatedUser() // Ensure user is authenticated and get user data
  
  const flow = await flowService.getFlowById(flowId)
  
  if (!flow) {
    notFound()
  }
  
  // Fetch stages for this flow
  const stages = await stageService.getStagesByFlowId(flowId)
  
  return <FlowViewClient flow={flow} stages={stages || []} userRole={user.role} />
}
