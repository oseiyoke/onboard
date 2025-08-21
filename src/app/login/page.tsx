"use client"

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeSelector } from '@/components/theme-selector'
import { login, signup, type AuthFormState } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const initialState: AuthFormState = { error: undefined }

  const [loginState, loginAction] = useFormState(login, initialState)
  const [signupState, signupAction] = useFormState(signup, initialState)

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme Selector in top right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeSelector />
      </div>

      <div className="w-full max-w-md">
        {isLogin ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome to Onboard</CardTitle>
              <CardDescription>
                Sign in to access your onboarding platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>
                {loginState?.error && (
                  <p className="text-sm text-red-500">{loginState.error}</p>
                )}
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
                <div className="text-center space-y-2">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                  >
                    Forgot your password?
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Need an account? Sign up
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">Create Account</CardTitle>
              <CardDescription>
                New to Onboard? Sign up to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={signupAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>
                {signupState?.error && (
                  <p className="text-sm text-red-500">{signupState.error}</p>
                )}
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
