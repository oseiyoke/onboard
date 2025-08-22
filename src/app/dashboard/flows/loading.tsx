import { FlowsHeader } from '@/components/flows/flows-header'
import { FlowsListSkeleton } from '@/components/flows/flows-skeleton'

export default function FlowsLoading() {
  return (
    <div className="space-y-6">
      <FlowsHeader />
      <FlowsListSkeleton />
    </div>
  )
}
