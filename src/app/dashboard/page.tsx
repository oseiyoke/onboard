import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
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

// Mock data for demonstration
const mockStats = {
  totalFlows: 3,
  activeParticipants: 12,
  completionRate: 78,
  avgTimeToComplete: '2.5 days'
}

const mockRecentActivity = [
  { id: 1, user: 'John Doe', action: 'completed', flow: 'Employee Onboarding', time: '2 hours ago' },
  { id: 2, user: 'Jane Smith', action: 'started', flow: 'Security Training', time: '4 hours ago' },
  { id: 3, user: 'Mike Johnson', action: 'completed', flow: 'Product Overview', time: '1 day ago' },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user role
  const { data: onboardUser } = await supabase
    .from('onboard_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!onboardUser) {
    redirect('/onboard')
  }

  const userRole = onboardUser.role

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalFlows}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeParticipants}</div>
              <p className="text-xs text-muted-foreground">
                +4 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.avgTimeToComplete}</div>
              <p className="text-xs text-muted-foreground">
                -0.5 days from last month
              </p>
            </CardContent>
          </Card>
        </div>

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
