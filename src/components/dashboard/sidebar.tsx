'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCompletionStatus } from '@/hooks/use-completion-status'
import { 
  LayoutDashboard, 
  Users, 
  Workflow,
  Upload,
  Brain,
  Award
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresCompletion?: boolean
  requiresMembership?: boolean
}

const adminNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Flow Builder',
    href: '/dashboard/flows',
    icon: Workflow,
  },
  {
    name: 'Content Library',
    href: '/dashboard/content',
    icon: Upload,
  },
  {
    name: 'Assessments',
    href: '/dashboard/assessments',
    icon: Brain,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  // {
  //   name: 'Analytics',
  //   href: '/dashboard/analytics',
  //   icon: BarChart3,
  // },
  // {
  //   name: 'Settings',
  //   href: '/dashboard/settings',
  //   icon: Settings,
  // },
]

const participantNavItems: NavItem[] = [
  {
    name: 'My Progress',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  // {
  //   name: 'Current Flow',
  //   href: '/dashboard/current',
  //   icon: Workflow,
  // },
  {
    name: 'Content Library',
    href: '/dashboard/content',
    icon: Upload,
    requiresMembership: true,
  },
  {
    name: 'Certificates',
    href: '/dashboard/certificate',
    icon: Award,
    requiresCompletion: true,
  },
]

interface DashboardSidebarProps {
  userRole: 'admin' | 'participant'
  isMember: boolean
}

export function DashboardSidebar({ userRole, isMember }: DashboardSidebarProps) {
  const pathname = usePathname()
  const completionStatus = useCompletionStatus()
  
  const navItems = userRole === 'admin' ? adminNavItems : participantNavItems

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-lg">Onboard</span>
        </Link>
      </div>
      
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isDisabled = userRole === 'participant' && 
            ((item.requiresCompletion && !completionStatus.hasCompletedFlows) ||
             (item.requiresMembership && !isMember))
          
          if (isDisabled) {
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 opacity-50 cursor-not-allowed'
                )}
                disabled
              >
                <item.icon className="w-4 h-4" />
                {item.name}
                {item.requiresCompletion && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Complete a flow
                  </span>
                )}
                {item.requiresMembership && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Member access
                  </span>
                )}
              </Button>
            )
          }
          
          return (
            <Button
              key={item.name}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                isActive && 'bg-primary text-primary-foreground'
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
