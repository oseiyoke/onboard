import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 bg-muted animate-pulse rounded w-32 mb-2" />
          <div className="h-5 bg-muted animate-pulse rounded w-64" />
        </div>
        <div className="h-10 bg-muted animate-pulse rounded w-28" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="h-5 bg-muted animate-pulse rounded w-24" />
              </div>
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted animate-pulse rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
