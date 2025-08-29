'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Loader2, User } from 'lucide-react'

export default function OnboardPage() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'check' | 'profile' | 'error'>('check')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const role = 'participant' // All new users are participants/dreamers
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      console.log('[Onboard] Starting user check via API');
      
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          console.log('[Onboard] User not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        const data = await response.json();
        console.log('[Onboard] User data:', data);

        if (!data.success || !data.user) {
          console.log('[Onboard] Invalid response, redirecting to login');
          router.push('/login');
          return;
        }

        // Check if user is already onboarded
        if (data.user.isOnboarded) {
          console.log('[Onboard] User already onboarded, redirecting to dashboard');
          router.replace('/dashboard');
          return;
        }

        console.log('[Onboard] User needs onboarding, showing profile form');
        setStep('profile');
      } catch (error) {
        console.error('[Onboard] Error checking user:', error);
        setError('Failed to verify authentication. Please try again.');
        setStep('error');
      }
    };

    checkUser();
  }, [router]);

  const handleCompleteProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    console.log('[Onboard] Creating profile with:', {
      firstName,
      lastName,
      role,
    })
    
    setLoading(true)
    setError(null)
    
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
        setError(data.error || 'Failed to complete onboarding')
        return
      }

      // Success! Redirect to dashboard
      console.log('[Onboard] Profile created successfully, redirecting to dashboard')
      router.replace('/dashboard')
      
    } catch (error) {
      console.error('Onboarding error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error || 'Unable to verify your authentication'}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Return to Login
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
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
          <CardTitle className="text-2xl font-bold">Welcome to Nigerian Dreamers!</CardTitle>
          <CardDescription>
            Let&apos;s complete your profile and start your journey
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



              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-3">
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
