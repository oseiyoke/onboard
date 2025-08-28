'use client'

import { Eye, Wand2 } from 'lucide-react'
import { FormWizard, WizardStep } from '@/components/shared/form-wizard'
import { useStepNavigation } from '@/hooks/use-step-navigation'
import { useAssessmentBuilder } from '@/hooks/use-assessment-builder'
import { AssessmentDetailsStep } from './steps/assessment-details-step'
import { AIGenerationStep } from './steps/ai-generation-step'
import { QuestionsStep } from './steps/questions-step'
import { PreviewStep } from './steps/preview-step'
import { AttemptsStep } from './steps/attempts-step'
import { AssessmentData, Question } from '@/lib/utils/assessment-mapper'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt'

interface AssessmentBuilderProps {
  creationMethod?: CreationMethod
  mode?: 'create' | 'edit'
  assessmentId?: string
  initialData?: AssessmentData
  initialQuestions?: Question[]
  isPublished?: boolean
  onCancel: () => void
}

export function AssessmentBuilder(props: AssessmentBuilderProps) {
  const {
    creationMethod = 'manual',
    mode = 'create',
    isPublished = false
  } = props

  const {
    assessmentData,
    questions,
    isGenerating,
    isSaving,
    isReadyToSave,
    updateAssessmentData,
    setQuestions,
    handleGenerateQuestions,
    handleSaveAssessment,
    validateStep,
    onCancel
  } = useAssessmentBuilder(props)

  // Define wizard steps
  const steps: WizardStep[] = [
    { 
      id: 'details', 
      title: 'Assessment Details', 
      description: 'Basic information about the assessment' 
    },
    ...(creationMethod !== 'manual' && mode === 'create' ? [{
      id: 'generation',
      title: 'AI Generation',
      description: 'Generate questions automatically',
      icon: <Wand2 className="w-4 h-4" />
    }] : []),
    { 
      id: 'questions', 
      title: 'Questions', 
      description: 'Create and manage questions' 
    },
    { 
      id: 'preview', 
      title: 'Preview & Publish', 
      description: mode === 'edit' ? 'Review and update assessment' : 'Review and save assessment',
      icon: <Eye className="w-4 h-4" />
    },
    ...(mode === 'edit' && isPublished ? [{
      id: 'attempts',
      title: 'Attempts',
      description: 'View assessment attempts and results'
    }] : [])
  ]

  const {
    currentStepId,
    isStepCompleted,
    isStepAccessible,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    goToStep,
    getStepError
  } = useStepNavigation({
    steps,
    initialStep: 'details',
    validation: {
      details: () => validateStep('details'),
      questions: () => validateStep('questions'),
      preview: () => validateStep('preview')
    }
  })

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'details':
        return (
          <AssessmentDetailsStep
            data={assessmentData}
            onChange={updateAssessmentData}
            errors={{ name: getStepError('details') || '' }}
          />
        )
      
      case 'generation':
        return (
          <AIGenerationStep
            creationMethod={creationMethod}
            assessmentData={assessmentData}
            onGenerate={async (data) => {
              await handleGenerateQuestions(data)
              // Auto-advance to questions step after successful generation
              goNext()
            }}
            onQuestionsGenerated={setQuestions}
            isGenerating={isGenerating}
          />
        )
      
      case 'questions':
        return (
          <QuestionsStep
            questions={questions}
            onChange={setQuestions}
            errors={{ questions: getStepError('questions') || '' }}
          />
        )
      
      case 'preview':
        return (
          <PreviewStep
            mode={mode}
            assessmentData={assessmentData}
            questions={questions}
            onSave={handleSaveAssessment}
            onCancel={onCancel}
            isSaving={isSaving}
            isReadyToSave={Boolean(isReadyToSave)}
          />
        )
      
      case 'attempts':
        return props.assessmentId ? (
          <AttemptsStep
            assessmentId={props.assessmentId}
            assessmentName={assessmentData.name}
          />
        ) : null
      
      default:
        return null
    }
  }

    return (
    <FormWizard
      steps={steps}
      currentStepId={currentStepId}
      onStepChange={goToStep}
      onNext={goNext}
      onBack={goBack}
      onCancel={currentStepId === 'preview' ? undefined : onCancel}
      canGoNext={canGoNext()}
      canGoBack={canGoBack()}
      isStepCompleted={isStepCompleted}
      isStepAccessible={isStepAccessible}
      showProgress={true}
    >
      {renderStepContent()}
    </FormWizard>
  )
}
