'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null
  loading: boolean
  orgId: string | null
  userRole: 'admin' | 'participant' | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  orgId: null,
  userRole: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'participant' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch user's organization and role
        const { data: userData, error } = await supabase
          .from('onboard_users')
          .select('org_id, role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setOrgId(userData.org_id)
          setUserRole(userData.role)
        } else if (error && error.code === 'PGRST116') {
          // User not found in onboard_users, needs onboarding
          console.log('User needs onboarding')
        }
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('onboard_users')
            .select('org_id, role')
            .eq('id', session.user.id)
            .single()
          
          if (userData) {
            setOrgId(userData.org_id)
            setUserRole(userData.role)
          } else if (error && error.code === 'PGRST116') {
            // User not found in onboard_users, needs onboarding
            console.log('User needs onboarding')
            setOrgId(null)
            setUserRole(null)
          }
        } else {
          setOrgId(null)
          setUserRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      orgId, 
      userRole, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
