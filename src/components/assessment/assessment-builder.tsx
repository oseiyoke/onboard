'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { QuestionBuilder } from './question-builder'
import { AIGenerationForm } from './ai-generation-form'
import { AssessmentPreview } from './assessment-preview'
import { AssessmentAttempts } from './assessment-attempts'

import { Save, Eye, Wand2, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  generateAssessment, 
  createAssessment, 
  createQuestions,
  updateQuestion,
  updateAssessment,
  publishAssessment 
} from '@/lib/api/assessment'
import {
  uiAssessmentToApi,
  uiQuestionsToApi,
  apiGeneratedQuestionsToUi,
  validateAssessmentForSave,
  createEmptyQuestion,
  isUuid,
  type AssessmentData,
  type Question
} from '@/lib/utils/assessment-mapper'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt'

interface AssessmentBuilderProps {
  creationMethod?: CreationMethod
  mode?: 'create' | 'edit'
  assessmentId?: string // For editing existing assessments
  initialData?: AssessmentData // For editing mode
  initialQuestions?: Question[] // For editing mode
  isPublished?: boolean // For showing attempts tab
  onCancel: () => void
}

type Step = 'details' | 'generation' | 'questions' | 'preview' | 'attempts'

interface StepConfig {
  id: Step
  title: string
  description: string
  icon?: React.ReactNode
}



export function AssessmentBuilder({ 
  creationMethod = 'manual', 
  mode = 'create',
  assessmentId, 
  initialData,
  initialQuestions,
  isPublished = false,
  onCancel 
}: AssessmentBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())
  const [assessmentData, setAssessmentData] = useState<AssessmentData>(
    initialData || {
      name: '',
      description: '',
      passingScore: 70,
      retryLimit: 3,
      randomizeQuestions: false,
      randomizeAnswers: true,
      showFeedback: true,
      showCorrectAnswers: true,
    }
  )
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | undefined>(assessmentId)
  const [lastGenerationSource, setLastGenerationSource] = useState<{
    type: CreationMethod
    contentId?: string
    prompt?: string
    youtubeUrl?: string
  } | null>(null)

  const steps: StepConfig[] = [
    { id: 'details', title: 'Assessment Details', description: 'Basic information about the assessment' },
    ...(creationMethod !== 'manual' && mode === 'create' ? [{ id: 'generation' as Step, title: 'AI Generation', description: 'Generate questions automatically', icon: <Wand2 className="w-4 h-4" /> }] : []),
    { id: 'questions', title: 'Questions', description: 'Create and manage questions' },
    { id: 'preview', title: 'Preview & Publish', description: mode === 'edit' ? 'Review and update assessment' : 'Review and save assessment', icon: <Eye className="w-4 h-4" /> },
    ...(mode === 'edit' && isPublished ? [{ id: 'attempts' as Step, title: 'Attempts', description: 'View assessment attempts and results' }] : []),
  ]

  // Auto-advance to appropriate step based on creation method
  useEffect(() => {
    if (creationMethod !== 'manual' && currentStep === 'details') {
      // Don't auto-advance, let user navigate manually
    }
  }, [creationMethod, currentStep])

  const handleGenerateQuestions = async (generationData: {
    type: CreationMethod
    contentId?: string
    prompt?: string
    youtubeUrl?: string
    questionCount: number
    difficulty: 'easy' | 'medium' | 'hard'
    questionTypes: string[]
    assessmentName: string
  }) => {
    setIsGenerating(true)
    try {
      // Normalize the generation data for the API
      let request
      
      if (generationData.type === 'youtube' || generationData.youtubeUrl) {
        // YouTube generation
        request = {
          youtubeUrl: generationData.youtubeUrl,
          assessmentConfig: {
            name: assessmentData.name,
            description: assessmentData.description,
            questionCount: generationData.questionCount,
            difficulty: generationData.difficulty,
            questionTypes: generationData.questionTypes,
            passingScore: assessmentData.passingScore,
          }
        }
        setLastGenerationSource({
          type: 'youtube',
          youtubeUrl: generationData.youtubeUrl
        })
      } else {
        // Content or prompt generation
        request = {
          type: generationData.type === 'manual' ? 'prompt' : generationData.type,
          contentId: generationData.contentId,
          prompt: generationData.prompt,
          assessmentConfig: {
            name: assessmentData.name,
            description: assessmentData.description,
            questionCount: generationData.questionCount,
            difficulty: generationData.difficulty,
            questionTypes: generationData.questionTypes,
            passingScore: assessmentData.passingScore,
          }
        }
        setLastGenerationSource({
          type: generationData.type,
          contentId: generationData.contentId,
          prompt: generationData.prompt
        })
      }

      const response = await generateAssessment(request)
      const uiQuestions = apiGeneratedQuestionsToUi(response.result.questions)
      
      setQuestions(uiQuestions)
      setCompletedSteps(prev => new Set([...prev, 'generation']))
      setCurrentStep('questions')
      
      toast.success(`Generated ${uiQuestions.length} questions successfully!`)
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAssessment = async (publish = false) => {
    // Validate assessment before saving
    const validationError = validateAssessmentForSave(assessmentData, questions)
    if (validationError) {
      toast.error(validationError)
      return null
    }

    setIsSaving(true)
    try {
      let assessmentId = savedAssessmentId

      // Create assessment if it doesn't exist, otherwise update existing assessment
      if (!assessmentId) {
        const generationType: 'manual' | 'content' | 'prompt' | 'youtube' = lastGenerationSource?.type || 'manual'
        const apiAssessment = uiAssessmentToApi(
          assessmentData,
          generationType,
          lastGenerationSource || undefined
        )

        const assessmentResponse = await createAssessment(apiAssessment)
        assessmentId = assessmentResponse.assessment.id
        setSavedAssessmentId(assessmentId)
      } else {
        // Update existing assessment details
        const generationType: 'manual' | 'content' | 'prompt' | 'youtube' = lastGenerationSource?.type || 'manual'
        const apiAssessment = uiAssessmentToApi(
          assessmentData,
          generationType,
          lastGenerationSource || undefined
        )

        await updateAssessment(assessmentId, apiAssessment)
      }

      // Handle questions - separate new questions from existing ones
      if (questions.length > 0 && assessmentId) {
        const newQuestions = questions.filter(q => !isUuid(q.id))
        const existingQuestions = questions.filter(q => isUuid(q.id))

        // Create new questions
        if (newQuestions.length > 0) {
          const apiNewQuestions = uiQuestionsToApi(newQuestions)
          await createQuestions(assessmentId, apiNewQuestions)
        }

        // Update existing questions
        if (existingQuestions.length > 0) {
          await Promise.all(
            existingQuestions.map(async (question) => {
              if (isUuid(question.id)) {
                const apiQuestion = uiQuestionsToApi([question])[0]
                // Remove the id from the update data since it's not needed for PATCH
                delete (apiQuestion as Record<string, unknown>).id
                await updateQuestion(question.id, apiQuestion)
              }
            })
          )
        }
      }

      // Publish if requested
      if (publish && assessmentId) {
        await publishAssessment(assessmentId)
        toast.success('Assessment published successfully!')
        
        // Redirect to assessments list after publish
        setTimeout(() => {
          window.location.href = '/dashboard/assessments'
        }, 1000)
      } else {
        toast.success('Assessment saved as draft!')
      }

      return assessmentId
    } catch (error) {
      console.error('Save failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save assessment')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishAssessment = async () => {
    await handleSaveAssessment(true)
  }

  const isReadyToSave = assessmentData.name && questions.length > 0

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep)
  const canGoNext = () => {
    const currentIndex = getCurrentStepIndex()
    return currentIndex < steps.length - 1
  }
  const canGoBack = () => getCurrentStepIndex() > 0

  const handleNext = () => {
    if (canGoNext()) {
      const currentIndex = getCurrentStepIndex()
      const nextStep = steps[currentIndex + 1]
      setCurrentStep(nextStep.id)
    }
  }

  const handleBack = () => {
    if (canGoBack()) {
      const currentIndex = getCurrentStepIndex()
      const prevStep = steps[currentIndex - 1]
      setCurrentStep(prevStep.id)
    }
  }

  const isStepCompleted = (stepId: Step) => {
    if (stepId === 'details') {
      return assessmentData.name && assessmentData.description
    }
    if (stepId === 'generation') {
      return questions.length > 0
    }
    if (stepId === 'questions') {
      return questions.length > 0 && questions.every(q => q.question && q.correctAnswer)
    }
    if (stepId === 'preview') {
      return isReadyToSave
    }
    return completedSteps.has(stepId)
  }

  const isStepAccessible = (stepId: Step) => {
    const stepIndex = steps.findIndex(step => step.id === stepId)
    const currentIndex = getCurrentStepIndex()
    
    // Always allow going to completed steps or current step
    if (stepIndex <= currentIndex || isStepCompleted(stepId)) {
      return true
    }
    
    // For next steps, check if previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepCompleted(steps[i].id)) {
        return false
      }
    }
    return true
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
  return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Assessment Details</h2>
              <p className="text-muted-foreground mb-6">
                Set up the basic information and settings for your assessment.
              </p>
            </div>
            {/* Custom form without Continue button */}
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Assessment Name *</label>
                  <input
                    id="name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={assessmentData.name}
                    onChange={(e) => setAssessmentData({ ...assessmentData, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Brief description of what this assessment covers..."
                    value={assessmentData.description}
                    onChange={(e) => setAssessmentData({ ...assessmentData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="passing-score" className="text-sm font-medium">Passing Score (%)</label>
                    <input
                      id="passing-score"
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={assessmentData.passingScore}
                      onChange={(e) => setAssessmentData({ ...assessmentData, passingScore: parseInt(e.target.value) || 70 })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="retry-limit" className="text-sm font-medium">Maximum Attempts</label>
                    <input
                      id="retry-limit"
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={assessmentData.retryLimit}
                      onChange={(e) => setAssessmentData({ ...assessmentData, retryLimit: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="time-limit" className="text-sm font-medium">Time Limit (optional)</label>
                  <input
                    id="time-limit"
                    type="number"
                    min="1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Minutes"
                    value={assessmentData.timeLimitSeconds ? Math.floor(assessmentData.timeLimitSeconds / 60) : ''}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value)
                      setAssessmentData({ 
                        ...assessmentData, 
                        timeLimitSeconds: minutes ? minutes * 60 : undefined 
                      })
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited time</p>
                </div>
              </div>

              {/* Assessment Options */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Assessment Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Randomize Questions</div>
                      <p className="text-xs text-muted-foreground">
                        Show questions in random order for each attempt
                      </p>
                    </div>
                    <Switch
                      checked={assessmentData.randomizeQuestions}
                      onCheckedChange={(checked: boolean) => 
                        setAssessmentData({ ...assessmentData, randomizeQuestions: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Randomize Answers</div>
                      <p className="text-xs text-muted-foreground">
                        Shuffle answer options for multiple choice questions
                      </p>
                    </div>
                    <Switch
                      checked={assessmentData.randomizeAnswers}
                      onCheckedChange={(checked: boolean) => 
                        setAssessmentData({ ...assessmentData, randomizeAnswers: checked })
                      }
                    />
      </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Show Feedback</div>
                      <p className="text-xs text-muted-foreground">
                        Display explanations for correct/incorrect answers
                      </p>
                    </div>
                    <Switch
                      checked={assessmentData.showFeedback}
                      onCheckedChange={(checked: boolean) => 
                        setAssessmentData({ ...assessmentData, showFeedback: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Show Correct Answers</div>
                      <p className="text-xs text-muted-foreground">
                        Reveal correct answers after completion
                      </p>
                    </div>
                    <Switch
                      checked={assessmentData.showCorrectAnswers}
                      onCheckedChange={(checked: boolean) => 
                        setAssessmentData({ ...assessmentData, showCorrectAnswers: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'generation':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">AI Generation Settings</h2>
              <p className="text-muted-foreground mb-6">
                Configure how questions should be generated automatically.
              </p>
            </div>
                <AIGenerationForm
              creationMethod={creationMethod as 'content' | 'youtube' | 'prompt'}
                  assessmentData={assessmentData}
                  onGenerate={handleGenerateQuestions}
                  isGenerating={isGenerating}
                />
          </div>
        )
      
      case 'questions':
        return (
          <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Questions</h2>
                <p className="text-muted-foreground">
                  {questions.length === 0 ? 'Add questions to your assessment.' : `${questions.length} question${questions.length !== 1 ? 's' : ''} created.`}
                </p>
              </div>
            <Button
              onClick={() => {
                const newQuestion = createEmptyQuestion(questions.length)
                setQuestions([...questions, newQuestion])
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>
          <QuestionBuilder
            questions={questions}
            onChange={setQuestions}
              onNext={() => {}} // Empty function to prevent duplicate navigation
            />
          </div>
        )
      
      case 'preview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Assessment Preview</h2>
              <p className="text-muted-foreground mb-6">
                Review your assessment before saving and publishing.
              </p>
            </div>
              <AssessmentPreview
                assessmentData={assessmentData}
                questions={questions}
              />
          </div>
        )
      
      case 'attempts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Assessment Attempts</h2>
              <p className="text-muted-foreground mb-6">
                View and analyze all attempts for this assessment.
              </p>
            </div>
            {assessmentId && (
              <AssessmentAttempts
                assessmentId={assessmentId}
                assessmentName={assessmentData.name}
              />
            )}
          </div>
        )
      
      default:
        return null
    }
  }

    return (
    <div className="min-h-screen bg-muted/30 p-2">
      <div className="max-w-7xl mx-auto flex gap-6 items-start">
        {/* Left Sidebar - Compact Steps Navigation (Fit Content) */}
        <div className="w-64 bg-card border border-border rounded-lg p-4 flex-shrink-0">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = isStepCompleted(step.id)
              const isAccessible = isStepAccessible(step.id)
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && setCurrentStep(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    'w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3',
                    isActive && 'bg-primary/10 border border-primary/20',
                    !isActive && isAccessible && 'hover:bg-muted/50',
                    !isAccessible && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/20 text-primary border border-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-medium text-sm flex items-center gap-2',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {step.title}
                      {step.icon && <span className="text-muted-foreground">{step.icon}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Content Area - Controlled Height with Footer Always Visible */}
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col h-[calc(100vh-6rem)]">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-8">
              {renderStepContent()}
            </div>
          </div>

          {/* Fixed Footer Navigation */}
          <div className="border-t border-border bg-muted/50 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!canGoBack()}
                className="gap-2"
              >
                Back: {canGoBack() ? steps[getCurrentStepIndex() - 1]?.title : ''}
              </Button>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {currentStep === 'preview' ? (
                  <>
            <Button 
              onClick={onCancel}
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleSaveAssessment(false)}
              disabled={!isReadyToSave || isSaving}
                      variant="outline"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button 
              onClick={handlePublishAssessment}
              disabled={!isReadyToSave || isSaving}
            >
              Save & Publish
            </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext() || (currentStep === 'details' && (!assessmentData.name || !assessmentData.description))}
                    className="gap-2"
                  >
                    Next: {canGoNext() ? steps[getCurrentStepIndex() + 1]?.title : ''}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
