'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Workflow,
  Upload,
  Brain
} from 'lucide-react'

const adminNavItems = [
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
    name: 'AI Assessments',
    href: '/dashboard/assessments',
    icon: Brain,
  },
  {
    name: 'Participants',
    href: '/dashboard/participants',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

const participantNavItems = [
  {
    name: 'My Progress',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Current Flow',
    href: '/dashboard/current',
    icon: Workflow,
  },
  {
    name: 'Resources',
    href: '/dashboard/resources',
    icon: FileText,
  },
]

interface DashboardSidebarProps {
  userRole: 'admin' | 'participant'
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname()
  
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
