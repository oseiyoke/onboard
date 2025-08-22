import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function FlowsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Bar Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* Flows Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
                <div className="h-8 w-8 bg-muted rounded" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-12" />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <div className="h-8 bg-muted rounded flex-1" />
                <div className="h-8 bg-muted rounded flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
