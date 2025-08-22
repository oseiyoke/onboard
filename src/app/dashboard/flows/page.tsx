import { getAuthenticatedUser } from '@/lib/auth/server'
import { flowService } from '@/lib/services/flow.service'
import { Suspense } from 'react'
import { FlowsList } from '@/components/flows/flows-list'
import { FlowsHeader } from '@/components/flows/flows-header'
import { FlowsListSkeleton } from '@/components/flows/flows-skeleton'

interface SearchParams {
  search?: string
  page?: string
  active?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function FlowsPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  return (
    <div className="space-y-6">
      <FlowsHeader />
      
      <Suspense key={JSON.stringify(params)} fallback={<FlowsListSkeleton />}>
        <FlowsListAsync searchParams={params} />
      </Suspense>
    </div>
  )
}

async function FlowsListAsync({ searchParams }: { searchParams: SearchParams }) {
  const query = {
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
    limit: 20, // Default limit
    active: searchParams.active === 'true' ? true : searchParams.active === 'false' ? false : undefined,
  }
  
  const result = await flowService.getFlows(query)
  
  return (
    <FlowsList
      initialFlows={result.flows}
      pagination={{
        page: result.page,
        limit: result.limit,
        total: result.total,
      }}
      searchParams={searchParams}
    />
  )
}