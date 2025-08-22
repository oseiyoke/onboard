import { createFlow } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { CreateFlowForm } from '@/components/flows/create-flow-form'

export default function NewFlowPage() {

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
        <CreateFlowForm createFlow={createFlow} />

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
