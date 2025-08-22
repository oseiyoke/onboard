import { Card, CardContent } from '@/components/ui/card'

export function FlowBuilderSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Skeleton */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="h-8 bg-muted animate-pulse rounded w-20" />
            <div>
              <div className="h-6 bg-muted animate-pulse rounded w-48 mb-2" />
              <div className="flex items-center gap-2">
                <div className="h-5 bg-muted animate-pulse rounded w-16" />
                <div className="h-4 bg-muted animate-pulse rounded w-20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 bg-muted animate-pulse rounded w-20" />
            <div className="h-9 bg-muted animate-pulse rounded w-24" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex">
        {/* Sidebar Skeleton */}
        <div className="w-80 border-r bg-background p-4">
          <div className="space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded w-24 mb-4" />
            
            {/* Node Types */}
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
            
            <div className="h-px bg-muted my-6" />
            
            {/* Properties Panel */}
            <div className="space-y-3">
              <div className="h-5 bg-muted animate-pulse rounded w-20" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Canvas Skeleton */}
        <div className="flex-1 relative bg-muted/5">
          <div className="absolute inset-4 flex items-center justify-center">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 bg-muted animate-pulse rounded-full mx-auto mb-4" />
                <div className="h-4 bg-muted animate-pulse rounded w-32 mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-24" />
              </CardContent>
            </Card>
          </div>
          
          {/* Mock nodes scattered around */}
          <div className="absolute top-16 left-1/4 w-32 h-16 bg-muted animate-pulse rounded" />
          <div className="absolute top-32 left-2/3 w-32 h-16 bg-muted animate-pulse rounded" />
          <div className="absolute bottom-32 left-1/2 w-32 h-16 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
