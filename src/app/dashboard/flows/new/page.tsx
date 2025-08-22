import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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
        <CreateFlowForm />
      </div>
    </div>
  )
}
