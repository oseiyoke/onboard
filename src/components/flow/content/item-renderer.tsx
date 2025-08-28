'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, FileText, Brain, Info } from 'lucide-react'
import { ContentViewer } from '@/components/content/content-viewer'
import { AssessmentPlayer } from '@/components/assessment/assessment-player'
import { toast } from 'sonner'

interface ItemRendererProps {
  item: {
    id: string
    type: 'content' | 'assessment' | 'info'
    title: string
    body?: string
    content_id?: string
    assessment_id?: string
  }
  onComplete: (score?: number) => void
  isCompleted: boolean
  enrollmentId: string
}

// Content item renderer
function ContentItemRenderer({ 
  contentId, 
  onComplete, 
  isCompleted 
}: { 
  contentId: string
  onComplete: (score?: number) => void
  isCompleted: boolean 
}) {
  const [content, setContent] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/content/${contentId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }
        const data = await response.json()
        setContent(data.content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchContent()
  }, [contentId])

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading content...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !content) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Failed to load content</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ContentViewer content={content as any} />
        <Separator className="my-4" />
        <div className="flex justify-end">
          {!isCompleted ? (
            <Button onClick={() => onComplete()} disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  Saving...
                </>
              ) : 'Mark as Complete'}
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-2">
              <CheckCircle className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Assessment item renderer
function AssessmentItemRenderer({ 
  assessmentId, 
  enrollmentId,
  onComplete, 
  isCompleted 
}: { 
  assessmentId: string
  enrollmentId: string
  onComplete: (score?: number) => void
  isCompleted: boolean 
}) {
  const [assessment, setAssessment] = useState<unknown>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [lastResult, setLastResult] = useState<unknown>(null)

  useEffect(() => {
    async function fetchAssessment() {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}?includeQuestions=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch assessment')
        }
        const data = await response.json()
        setAssessment(data.assessment as any)
        
        // Also check if there are previous attempts
        const attemptsResponse = await fetch(`/api/assessments/${assessmentId}/attempts`)
        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json()
          if (attemptsData.attempts && attemptsData.attempts.length > 0) {
            const lastAttempt = attemptsData.attempts[0]
            if (lastAttempt.completed_at) {
              setLastResult(lastAttempt as any)
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssessment()
  }, [assessmentId])

  const handleStartAssessment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create assessment attempt')
      }
      
      const data = await response.json()
      setAttemptId(data.attemptId)
      setShowPlayer(true)
    } catch (err) {
      toast.error('Failed to start assessment')
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssessmentComplete = async (answers: Record<string, unknown>, timeSpent: number) => {
    try {
      const response = await fetch(`/api/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          time_spent_seconds: timeSpent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit assessment')
      }

      const result = await response.json()
      setLastResult(result.attempt as any)
      setShowPlayer(false)
      
      // Calculate score as percentage
      const scorePercent = result.attempt.max_score && result.attempt.max_score > 0 
        ? (result.attempt.score / result.attempt.max_score) * 100 
        : 0
      const passed = scorePercent >= (assessment as any)?.passing_score
      
      if (passed) {
        toast.success(`Assessment completed! Score: ${Math.round(scorePercent)}%`)
        onComplete(scorePercent)
      } else {
        toast.error(`Assessment failed. Score: ${Math.round(scorePercent)}%. Passing score: ${(assessment as any)?.passing_score}%`)
      }
    } catch (error) {
      toast.error('Failed to submit assessment')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading assessment...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !assessment) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Failed to load assessment</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const typedAssessment = assessment as any
  const typedLastResult = lastResult as any

  if (showPlayer && attemptId) {
    return (
      <AssessmentPlayer 
        assessment={typedAssessment}
        attemptId={attemptId}
        onComplete={handleAssessmentComplete}
        onCancel={() => setShowPlayer(false)}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          {typedAssessment?.name}
        </CardTitle>
        {typedAssessment?.description && (
          <p className="text-muted-foreground">{typedAssessment.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Questions:</span>
            <span className="ml-2 font-medium">{typedAssessment?.questions?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Passing Score:</span>
            <span className="ml-2 font-medium">{typedAssessment?.passing_score}%</span>
          </div>
        </div>

        {typedLastResult && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Previous Result</h4>
            <div className="text-sm space-y-1">
              <div>
                Score: <span className="font-medium">
                  {typedLastResult.max_score && typedLastResult.max_score > 0 
                    ? Math.round((typedLastResult.score / typedLastResult.max_score) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        <Separator />
        <div className="flex justify-end">
          {isCompleted ? (
            <Badge variant="secondary" className="gap-2">
              <CheckCircle className="w-3 h-3" />
              Completed
            </Badge>
          ) : (
            <Button onClick={handleStartAssessment} className="gap-2">
              <Brain className="w-4 h-4" />
              {typedLastResult ? 'Retake Assessment' : 'Start Assessment'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ItemRenderer({ item, onComplete, isCompleted, enrollmentId }: ItemRendererProps) {
  const [buttonLoading, setButtonLoading] = useState(false)
  
  const handleMarkComplete = async () => {
    if (buttonLoading) return
    setButtonLoading(true)
    try {
      await onComplete()
    } finally {
      setButtonLoading(false)
    }
  }
  
  if (item.type === 'info') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{item.body || 'No content available.'}</p>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            {!isCompleted ? (
              <Button onClick={handleMarkComplete} disabled={buttonLoading}>
                {buttonLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                    Saving...
                  </>
                ) : 'Mark as Complete'}
              </Button>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (item.type === 'content' && item.content_id) {
    return (
      <ContentItemRenderer 
        contentId={item.content_id}
        onComplete={handleMarkComplete}
        isCompleted={isCompleted}
      />
    )
  }

  if (item.type === 'assessment' && item.assessment_id) {
    return (
      <AssessmentItemRenderer 
        assessmentId={item.assessment_id}
        enrollmentId={enrollmentId}
        onComplete={handleMarkComplete}
        isCompleted={isCompleted}
      />
    )
  }

  // Fallback for items without proper configuration
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            This item is not properly configured.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
