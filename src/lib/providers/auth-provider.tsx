'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null
  loading: boolean
  userRole: 'admin' | 'participant' | null
  isMember: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  isMember: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'participant' | null>(null)
  const [isMember, setIsMember] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch user's organization and role
        const { data: userData, error } = await supabase
          .from('onboard_users')
          .select('role, member')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role)
          setIsMember(userData.role === 'admin' || userData.member || false)
        } else if (error && error.code === 'PGRST116') {
          // User not found in onboard_users, needs onboarding
          console.log('User needs onboarding')
          setIsMember(false)
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
            .select('role, member')
            .eq('id', session.user.id)
            .single()
          
          if (userData) {
            setUserRole(userData.role)
            setIsMember(userData.role === 'admin' || userData.member || false)
          } else if (error && error.code === 'PGRST116') {
            // User not found in onboard_users, needs onboarding
            console.log('User needs onboarding')
            setUserRole(null)
            setIsMember(false)
          }
        } else {
          setUserRole(null)
          setIsMember(false)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    try {
      // Call our API endpoint for logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Also call Supabase signOut to clean up client state
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      userRole, 
      isMember,
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
