'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

type MinimalAuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const MinimalAuthContext = createContext<MinimalAuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

interface MinimalAuthProviderProps {
  children: React.ReactNode
  initialUser?: User | null
}

export function MinimalAuthProvider({ children, initialUser = null }: MinimalAuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  const supabase = createClient()

  useEffect(() => {
    // Only set up auth state listener, don't fetch additional data
    let mounted = true

    const getSession = async () => {
      if (initialUser) {
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, initialUser])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <MinimalAuthContext.Provider value={{ 
      user, 
      loading, 
      signOut 
    }}>
      {children}
    </MinimalAuthContext.Provider>
  )
}

export const useMinimalAuth = () => {
  const context = useContext(MinimalAuthContext)
  if (context === undefined) {
    throw new Error('useMinimalAuth must be used within a MinimalAuthProvider')
  }
  return context
}
