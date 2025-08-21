'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/providers/auth-provider'
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
  const { orgId, user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const createFlowMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('onboard_flows')
        .insert({
          org_id: orgId,
          name,
          description: description || null,
          flow_data: {
            nodes: [
              {
                id: 'start',
                type: 'start',
                position: { x: 250, y: 50 },
                data: { label: 'Start' }
              }
            ],
            edges: []
          },
          is_active: false,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (flow) => {
      router.push(`/dashboard/flows/${flow.id}/edit`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      createFlowMutation.mutate()
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
                  disabled={!name.trim() || createFlowMutation.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {createFlowMutation.isPending ? 'Creating...' : 'Create Flow'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/flows">
                    Cancel
                  </Link>
                </Button>
              </div>

              {createFlowMutation.error && (
                <p className="text-sm text-red-600">
                  {createFlowMutation.error instanceof Error 
                    ? createFlowMutation.error.message 
                    : 'Failed to create flow'
                  }
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
