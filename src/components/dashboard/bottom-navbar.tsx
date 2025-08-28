'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompletionStatus } from '@/hooks/use-completion-status'
import { getFilteredNavigationItems } from '@/lib/navigation-items'



interface BottomNavbarProps {
  userRole: 'admin' | 'participant'
  isMember: boolean
}

export function BottomNavbar({ userRole, isMember }: BottomNavbarProps) {
  const pathname = usePathname()
  const completionStatus = useCompletionStatus()
  
  const navItems = getFilteredNavigationItems(
    userRole, 
    isMember, 
    completionStatus.hasCompletedFlows
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div className="flex items-center justify-around h-16 px-4 w-full max-w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mb-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium truncate max-w-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.shortName}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
