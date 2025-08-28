'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCompletionStatus } from '@/hooks/use-completion-status'
import { getFilteredNavigationItems } from '@/lib/navigation-items'



interface DashboardSidebarProps {
  userRole: 'admin' | 'participant'
  isMember: boolean
}

export function DashboardSidebar({ userRole, isMember }: DashboardSidebarProps) {
  const pathname = usePathname()
  const completionStatus = useCompletionStatus()
  
  const navItems = getFilteredNavigationItems(
    userRole, 
    isMember, 
    completionStatus.hasCompletedFlows
  )

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
          const Icon = item.icon
          
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
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
