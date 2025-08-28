'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssessmentBuilder } from '@/components/assessment/assessment-builder'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { apiAssessmentToUiData, apiQuestionToUi } from '@/lib/utils/assessment-mapper'
import type { Assessment, Question as ApiQuestion } from '@/lib/services/assessment.service'

interface AssessmentWithQuestions extends Assessment {
  questions: ApiQuestion[]
}

async function fetchAssessment(id: string): Promise<AssessmentWithQuestions | null> {
  try {
    const res = await fetch(`/api/assessments/${id}?includeQuestions=true`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 404) {
        return null
      }
      console.error('Failed to fetch assessment', await res.text())
      return null
    }

    const json = await res.json() as { assessment: AssessmentWithQuestions }
    return json.assessment
  } catch (e) {
    console.error('Error while fetching assessment', e)
    return null
  }
}

export default function EditAssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const assessmentId = params.id as string

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment(assessmentId)
        .then((data) => {
          if (data) {
            setAssessment(data)
          } else {
            setError('Assessment not found')
          }
        })
        .catch(() => {
          setError('Failed to load assessment')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [assessmentId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assessments">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assessments">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              😔
            </div>
            <div>
              <h3 className="font-semibold">Assessment not found</h3>
              <p className="text-muted-foreground text-sm">
                {error || 'The assessment you are looking for does not exist or has been deleted.'}
              </p>
            </div>
            <Link href="/dashboard/assessments">
              <Button>Back to Assessments</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Convert API data to UI format for the builder
  const initialData = apiAssessmentToUiData(assessment)
  const initialQuestions = (assessment.questions || [])
    .sort((a, b) => a.position - b.position)
    .map(apiQuestionToUi)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/assessments">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
      </div>
      
      <AssessmentBuilder 
        mode="edit"
        assessmentId={assessmentId}
        initialData={initialData}
        initialQuestions={initialQuestions}
        isPublished={assessment.is_published}
        onCancel={() => router.push('/dashboard/assessments')}
      />
    </div>
  )
}
