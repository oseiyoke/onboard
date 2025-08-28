'use client'

import { AIGenerationForm } from '@/components/assessment/ai-generation-form'
import { AssessmentData, Question } from '@/lib/utils/assessment-mapper'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt'

interface AIGenerationStepProps {
  creationMethod: CreationMethod
  assessmentData: AssessmentData
  onGenerate: (data: {
    type: CreationMethod
    contentId?: string
    prompt?: string
    youtubeUrl?: string
    questionCount: number
    difficulty: 'easy' | 'medium' | 'hard'
    questionTypes: string[]
    assessmentName: string
  }) => Promise<void>
  onQuestionsGenerated: (questions: Question[]) => void
  isGenerating: boolean
}

export function AIGenerationStep({
  creationMethod,
  assessmentData,
  onGenerate,
  isGenerating
}: AIGenerationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">AI Generation Settings</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Configure how questions should be generated automatically.
        </p>
      </div>
      
      <AIGenerationForm
        creationMethod={creationMethod as 'content' | 'youtube' | 'prompt'}
        assessmentData={assessmentData}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />
    </div>
  )
}
