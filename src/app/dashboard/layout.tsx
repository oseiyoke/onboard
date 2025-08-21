import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated → login
  if (!user) {
    redirect('/login')
  }

  // Fetch onboarding info
  const { data: onboardUser } = await supabase
    .from('onboard_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!onboardUser) {
    redirect('/onboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar userRole={onboardUser.role} />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
