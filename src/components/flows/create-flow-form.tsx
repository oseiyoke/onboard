'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface CreateFlowFormProps {
  createFlow: (formData: FormData) => Promise<{ error?: string } | void>
}

export function CreateFlowForm({ createFlow }: CreateFlowFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const name = formData.get('name') as string
    if (!name.trim()) {
      setError('Flow name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createFlow(formData)
      if (result?.error) {
        setError(result.error)
      }
      // Success case is handled by redirect in the server action
    } catch (err) {
      console.error('Flow creation error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flow Details</CardTitle>
        <CardDescription>
          Provide a name and description for your new onboarding flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Flow Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Employee Onboarding, New Hire Training"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what this onboarding flow covers..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Creating...' : 'Create Flow'}
            </Button>
            <Button variant="outline" asChild disabled={loading}>
              <Link href="/dashboard/flows">
                Cancel
              </Link>
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
