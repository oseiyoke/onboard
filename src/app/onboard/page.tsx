'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, User } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function OnboardPage() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'check' | 'profile' | 'error'>('check')
  // Single-org architecture – no organisation fields needed
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin' | 'participant'>('admin')
  // We no longer need to store the user locally
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  let supabase: SupabaseClient | undefined

  // createClient may throw in edge environments – capture safely
  try {
    supabase = createClient()
  } catch (err: unknown) {
    console.error('Failed to create Supabase client:', err)
    setError((err as Error).message)
  }

  useEffect(() => {
    const checkUser = async () => {
      console.log('[Onboard] Starting user check');
      
      // Check if supabase client was created successfully
      if (!supabase) {
        console.error('[Onboard] Supabase client not available');
        setStep('error');
        return;
      }
      
      try {
        // 1. Get authenticated user
        console.log('[Onboard] Calling supabase.auth.getUser()');
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        console.log('[Onboard] getUser() resolved');
        console.log('[Onboard] Auth user: and error', user, authError);
        if (authError) {
          console.error('[Onboard] supabase.auth.getUser() error:', authError);
        }
        console.log('[Onboard] Auth user:', user);

        if (!user) {
          console.log('[Onboard] No user found. Redirecting to /login');
          router.push('/login');
          return;
        }

        // user is only needed for id; no local state required

        // 2. Check if user already exists in onboarding table
        const {
          data: existingUser,
          error: existingUserError,
        } = await supabase
          .from('onboard_users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (existingUserError) {
          console.error('[Onboard] Error querying onboard_users:', existingUserError);
        }

        if (existingUser) {
          console.log('[Onboard] User already onboarded. Redirecting to /dashboard');
          router.replace('/dashboard');
          return;
        }

        console.log('[Onboard] New user – proceeding to profile setup');
        setStep('profile');
      } catch (error) {
        console.error('[Onboard] Unexpected error during checkUser()', error);
      }
    };

    checkUser();
    // removed supabase from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Organisation slug helpers removed

  const handleCompleteProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) return

    console.log('[Onboard] Creating profile with:', {
      firstName,
      lastName,
      role,
    })
    setLoading(true)
    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName,
          lastName,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to complete onboarding')
        return
      }

      // Success! Redirect to dashboard
      router.replace('/dashboard')
      
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error || 'Unable to connect to Supabase'}
            </p>
            <div className="bg-muted p-4 rounded-md space-y-2">
              <p className="text-sm font-semibold">To fix this:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Create a <code className="bg-background px-1 py-0.5 rounded">.env.local</code> file in your project root</li>
                <li>Add your Supabase credentials:</li>
              </ol>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
              <p className="text-sm">
                Get these values from your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Supabase dashboard</a>
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'check') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Setting up your account...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Onboard!</CardTitle>
          <CardDescription>
            Let&apos;s complete your profile and get you started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organisation setup removed in single-org architecture */}

          {step === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Your Profile</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'participant') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Administrators can create flows and manage content
                </p>
              </div>

              <div className="flex gap-3">
                {/* No back button since org step is removed */}
                <Button 
                  onClick={handleCompleteProfile}
                  disabled={loading || !firstName.trim() || !lastName.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
