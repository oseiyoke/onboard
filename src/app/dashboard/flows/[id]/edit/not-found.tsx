import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function FlowNotFound() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Flow not found</h1>
          <p className="text-muted-foreground mb-6">
            The flow you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            It may have been deleted or you may not have permission to view it.
          </p>
          <Button asChild>
            <Link href="/dashboard/flows">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flows
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
