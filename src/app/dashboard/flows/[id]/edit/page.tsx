import { getAuthenticatedUser } from '@/lib/auth/server'
import { flowService } from '@/lib/services/flow.service'
import { notFound } from 'next/navigation'
import { FlowBuilder } from '@/components/flow/flow-builder'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditFlowPage({ params }: PageProps) {
  const { id: flowId } = await params
  const user = await getAuthenticatedUser()
  
  const flow = await flowService.getFlowById(flowId)
  
  if (!flow) {
    notFound()
  }
  
  return (
    <div className="h-screen flex flex-col">
      <FlowBuilder initialFlow={flow} />
    </div>
  )
}
