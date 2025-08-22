import { getAuthenticatedUser } from '@/lib/auth/server'
import { flowService } from '@/lib/services/flow.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Users, 
  Workflow, 
  FileText, 
  BarChart3, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Suspense } from 'react'

// Fetch real stats from the database
async function getDashboardStats(orgId: string) {
  const flowsResult = await flowService.getFlowsByOrg(orgId, { page: 1, limit: 100 })
  
  const totalFlows = flowsResult.total
  const activeFlows = flowsResult.flows.filter(f => f.is_active).length
  
  return {
    totalFlows,
    activeFlows,
    draftFlows: totalFlows - activeFlows,
    // TODO: Implement real participant stats when we have the data
    activeParticipants: 0,
    completionRate: 0,
    avgTimeToComplete: 'N/A'
  }
}

function DashboardStatsCards({ stats }: { stats: Awaited<ReturnType<typeof getDashboardStats>> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
          <Workflow className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFlows}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeFlows} active, {stats.draftFlows} drafts
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeParticipants}</div>
          <p className="text-xs text-muted-foreground">
            Across all flows
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Overall completion rate
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgTimeToComplete}</div>
          <p className="text-xs text-muted-foreground">
            Average time to complete
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardStatsSkeleton() {
  return (
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
  )
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  const userRole = user.role

  if (userRole === 'admin') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your onboarding platform
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/flows/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Flow
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsAsync orgId={user.orgId} />
        </Suspense>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Flow Builder
              </CardTitle>
              <CardDescription>
                Create and manage onboarding flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/flows">
                  Manage Flows
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content Library
              </CardTitle>
              <CardDescription>
                Upload and organize your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/content">
                  View Content
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                Track performance and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/analytics">
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Participant Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Progress</h1>
        <p className="text-muted-foreground">
          Track your onboarding journey
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Onboarding Flow</CardTitle>
          <CardDescription>
            Continue where you left off
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Employee Onboarding</h3>
              <Badge>In Progress</Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">3 of 5 phases completed</p>
            <Button>
              Continue Flow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Server component to fetch stats
async function DashboardStatsAsync({ orgId }: { orgId: string }) {
  const stats = await getDashboardStats(orgId)
  return <DashboardStatsCards stats={stats} />
}
