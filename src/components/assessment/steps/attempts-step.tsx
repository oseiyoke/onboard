'use client'

import { AssessmentAttempts } from '@/components/assessment/assessment-attempts'

interface AttemptsStepProps {
  assessmentId: string
  assessmentName: string
}

export function AttemptsStep({ assessmentId, assessmentName }: AttemptsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Assessment Attempts</h2>
        <p className="text-muted-foreground text-sm mb-6">
          View and analyze all attempts for this assessment.
        </p>
      </div>
      
      <AssessmentAttempts
        assessmentId={assessmentId}
        assessmentName={assessmentName}
      />
    </div>
  )
}
