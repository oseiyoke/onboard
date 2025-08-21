'use client'

import { useParams } from 'next/navigation'
import { FlowBuilder } from '@/components/flow/flow-builder'

export default function EditFlowPage() {
  const params = useParams()
  const flowId = params.id as string

  return (
    <div className="h-screen flex flex-col">
      <FlowBuilder flowId={flowId} />
    </div>
  )
}
