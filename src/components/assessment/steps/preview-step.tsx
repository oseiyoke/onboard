'use client'

import { Button } from '@/components/ui/button'
import { AssessmentPreview } from '@/components/assessment/assessment-preview'
import { AssessmentData, Question } from '@/lib/utils/assessment-mapper'
import { Save } from 'lucide-react'

interface PreviewStepProps {
  mode: 'create' | 'edit'
  assessmentData: AssessmentData
  questions: Question[]
  onSave: (publish?: boolean) => Promise<string | null>
  onCancel: () => void
  isSaving: boolean
  isReadyToSave: boolean
}

export function PreviewStep({
  mode,
  assessmentData,
  questions,
  onSave,
  onCancel,
  isSaving,
  isReadyToSave
}: PreviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Assessment Preview</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Review your assessment before saving and publishing.
        </p>
      </div>
      
      <AssessmentPreview
        assessmentData={assessmentData}
        questions={questions}
      />
      
      <div className="flex gap-3 pt-4">
        <Button 
          onClick={onCancel}
          variant="outline"
          disabled={isSaving}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={() => onSave(false)}
          disabled={!isReadyToSave || isSaving}
          variant="outline"
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </Button>
        
        <Button 
          onClick={() => onSave(true)}
          disabled={!isReadyToSave || isSaving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Publishing...' : `Save & Publish`}
        </Button>
      </div>
    </div>
  )
}
