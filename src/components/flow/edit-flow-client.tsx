'use client'

import { useRouter } from 'next/navigation'
import { StageBuilder } from '@/components/flow/stage-builder'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Flow } from '@/lib/services/flow.service'
import { StageWithItems } from '@/lib/services/stage.service'

interface EditFlowClientProps {
  flow: Flow
  stages: StageWithItems[]
}

export function EditFlowClient({ flow, stages }: EditFlowClientProps) {
  const router = useRouter()

  const handleCancel = () => {
    router.push('/dashboard/flows')
  }

  const handleSave = (flowId: string) => {
    router.push(`/dashboard/flows/${flowId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/flows">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Flows
              </Button>
            </Link>
            
            <div>
              <h1 className="text-lg font-semibold">Edit Flow</h1>
              <p className="text-sm text-muted-foreground">{flow.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Builder */}
      <StageBuilder 
        initialFlow={flow} 
        stages={stages} 
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}
