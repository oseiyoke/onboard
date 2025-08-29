import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function FlowsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Journey Builder</h1>
        <p className="text-muted-foreground">
          Create and manage your dreamer journeys
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard/flows/new">
          <Plus className="w-4 h-4 mr-2" />
          Create Journey
        </Link>
      </Button>
    </div>
  )
}
