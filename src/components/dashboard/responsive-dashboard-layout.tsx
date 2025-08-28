'use client'

import { useIsMobile } from '@/hooks/use-mobile'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'
import { BottomNavbar } from './bottom-navbar'

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
  userRole: 'admin' | 'participant'
  isMember: boolean
}

export function ResponsiveDashboardLayout({ 
  children, 
  userRole, 
  isMember 
}: ResponsiveDashboardLayoutProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    // Mobile layout: Bottom navigation for both admin and participant
    return (
      <div className="flex flex-col min-h-screen w-full">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 pb-20 w-full overflow-x-hidden">
          {children}
        </main>
        <BottomNavbar userRole={userRole} isMember={isMember} />
      </div>
    )
  }

  // Desktop layout: Sidebar for both admin and participant
  return (
    <>
      <DashboardSidebar userRole={userRole} isMember={isMember} />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </>
  )
}
