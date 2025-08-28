'use client'

import { Button } from '@/components/ui/button'
import { QuestionBuilder } from '@/components/assessment/question-builder'
import { Question, createEmptyQuestion } from '@/lib/utils/assessment-mapper'
import { Plus } from 'lucide-react'

interface QuestionsStepProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
  errors?: Record<string, string>
}

export function QuestionsStep({ 
  questions, 
  onChange, 
  errors = {} 
}: QuestionsStepProps) {
  const handleAddQuestion = () => {
    const newQuestion = createEmptyQuestion(questions.length)
    onChange([...questions, newQuestion])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Questions</h2>
          <p className="text-muted-foreground text-sm">
            {questions.length === 0 
              ? 'Add questions to your assessment.' 
              : `${questions.length} question${questions.length !== 1 ? 's' : ''} created.`
            }
          </p>
        </div>
        
        <Button
          onClick={handleAddQuestion}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </div>
      
      {errors.questions && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{errors.questions}</p>
        </div>
      )}
      
      <QuestionBuilder
        questions={questions}
        onChange={onChange}
        onNext={() => {}} // Empty function to prevent duplicate navigation
      />
    </div>
  )
}
