'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle, 
  Calendar,
  Trophy,
  Star,
  Sparkles
} from 'lucide-react'
import { useAvailableFlows } from '@/hooks/use-flows'
import { useCompletionStatus } from '@/hooks/use-completion-status'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

export function CertificatePage() {
  const { flows, loading } = useAvailableFlows()
  const completionStatus = useCompletionStatus()
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false)

  const completedFlows = flows.filter(f => 
    f.enrollment?.completed_at || 
    (f.progress && f.progress.percentage >= 100)
  )

  const handleDownloadCertificate = async (flowId: string, flowName: string) => {
    setIsGeneratingCertificate(true)
    try {
      // Simulate certificate generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Certificate for "${flowName}" is being generated!`)
      // TODO: Implement actual certificate generation
    } catch {
      toast.error('Failed to generate certificate')
    } finally {
      setIsGeneratingCertificate(false)
    }
  }

  const handleShareAchievement = async (flowName: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Learning Achievement',
          text: `I just completed the "${flowName}" learning flow!`,
          url: window.location.origin + '/dashboard/certificate'
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `I just completed the "${flowName}" learning flow! ${window.location.origin}/dashboard/certificate`
        )
        toast.success('Achievement copied to clipboard!')
      }
    } catch {
      toast.error('Failed to share achievement')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!completionStatus.hasCompletedFlows) {
    return (
      <div className="space-y-6">
        <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
          <Award className="w-8 h-8" />
          Certificates & Achievements
        </h1>
          <p className="text-muted-foreground">
            Complete learning flows to unlock your certificates and achievements
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Award className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Certificates Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete your first learning flow to unlock certificates and celebrate your achievements!
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Trophy className="w-4 h-4" />
                  Overall Progress
                </div>
                <Progress value={completionStatus.completionPercentage} className="mb-2" />
                <div className="text-sm font-medium">
                  {completionStatus.completedFlows} of {completionStatus.totalFlows} flows completed
                </div>
              </div>
              
              <Button asChild className="gap-2">
                <a href="/dashboard">
                  <Sparkles className="w-4 h-4" />
                  Continue Learning
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3 text-primary">
          <Award className="w-8 h-8" />
          Certificates & Achievements
        </h1>
        <p className="text-muted-foreground">
          Celebrate your learning accomplishments and download your certificates
        </p>
      </div>

      {/* Achievement Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Trophy className="w-5 h-5" />
            Your Learning Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completionStatus.completedFlows}
              </div>
              <div className="text-sm text-muted-foreground">Flows Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completionStatus.completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completedFlows.length}
              </div>
              <div className="text-sm text-muted-foreground">Certificates Earned</div>
            </div>
          </div>
          <Progress value={completionStatus.completionPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Completed Flows Certificates */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Your Certificates
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {completedFlows.map((flowPreview) => {
            const completionDate = flowPreview.enrollment?.completed_at || new Date().toISOString()
            
            return (
              <Card key={flowPreview.flow.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <Award className="w-8 h-8" />
                      <Star className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      Certificate of Completion
                    </h3>
                    <p className="text-primary-foreground/80 text-sm">
                      {flowPreview.flow.name}
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>
                  <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/20 rounded-full"></div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Completed on {format(new Date(completionDate), 'MMM dd, yyyy')}
                    </div>
                    
                    {flowPreview.progress && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          100% Complete
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleDownloadCertificate(flowPreview.flow.id, flowPreview.flow.name)}
                      disabled={isGeneratingCertificate}
                      className="flex-1 gap-2"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                      {isGeneratingCertificate ? 'Generating...' : 'Download'}
                    </Button>
                    <Button 
                      onClick={() => handleShareAchievement(flowPreview.flow.name)}
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Continue Learning Section */}
      {completionStatus.completedFlows < completionStatus.totalFlows && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Keep Learning!</h3>
              <p className="text-muted-foreground">
                You have {completionStatus.totalFlows - completionStatus.completedFlows} more flows to complete. 
                Continue your journey to earn more certificates!
              </p>
            </div>
            <Button asChild className="gap-2">
              <a href="/dashboard">
                <Sparkles className="w-4 h-4" />
                Continue Learning
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
