import { getAuthenticatedUser } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, Download } from 'lucide-react'

export default async function ResourcesPage() {
  const user = await getAuthenticatedUser()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'hsl(262, 83%, 58%)' }}>
          Resources
        </h1>
        <p className="text-muted-foreground">
          Access helpful resources and documents for your onboarding journey
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Employee Handbook
            </CardTitle>
            <CardDescription>
              Complete guide to company policies and procedures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Reference Guide
            </CardTitle>
            <CardDescription>
              Essential information at your fingertips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              IT Setup Guide
            </CardTitle>
            <CardDescription>
              Step-by-step technical setup instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get support from your onboarding team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">HR Support</p>
              <p className="text-sm text-muted-foreground">hr@company.com</p>
            </div>
            <Button variant="outline" size="sm">
              Contact
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">IT Support</p>
              <p className="text-sm text-muted-foreground">it@company.com</p>
            </div>
            <Button variant="outline" size="sm">
              Contact
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Manager</p>
              <p className="text-sm text-muted-foreground">Your direct supervisor</p>
            </div>
            <Button variant="outline" size="sm">
              Contact
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

