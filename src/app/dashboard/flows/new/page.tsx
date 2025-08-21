'use client'

import { useState } from 'react'
import { createFlow } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewFlowPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('description', description)

    try {
      const result = await createFlow(formData)
      if (result?.error) {
        setError(result.error)
      }
      // Success case is handled by redirect in the server action
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/flows">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Flows
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Flow</h1>
          <p className="text-muted-foreground">
            Set up the basic information for your onboarding flow
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
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
                  placeholder="e.g. Employee Onboarding, New Hire Training"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this onboarding flow covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={!name.trim() || loading}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create Flow'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/flows">
                    Cancel
                  </Link>
                </Button>
              </div>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Quick Start Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                1
              </div>
              <div>
                <p className="font-medium">Start with a clear name</p>
                <p className="text-sm text-muted-foreground">
                  Choose a descriptive name that clearly indicates the purpose of this flow
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                2
              </div>
              <div>
                <p className="font-medium">Add a helpful description</p>
                <p className="text-sm text-muted-foreground">
                  Explain what participants will learn and accomplish in this flow
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                3
              </div>
              <div>
                <p className="font-medium">Build your flow visually</p>
                <p className="text-sm text-muted-foreground">
                  After creating, you&apos;ll use the visual flow builder to add phases and content
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
