import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ResponsiveDashboardLayout } from '@/components/dashboard/responsive-dashboard-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

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
    .select('role, member')
    .eq('id', user.id)
    .single()

  if (!onboardUser) {
    redirect('/onboard')
  }

  const isMember = onboardUser.role === 'admin' || onboardUser.member || false

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ResponsiveDashboardLayout 
        userRole={onboardUser.role}
        isMember={isMember}
      >
        {children}
      </ResponsiveDashboardLayout>
    </div>
  )
}
