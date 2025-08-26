'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { QuestionBuilder } from './question-builder'
import { AIGenerationForm } from './ai-generation-form'
import { AssessmentPreview } from './assessment-preview'
import { Save, Eye, Wand2, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt'

interface AssessmentBuilderProps {
  creationMethod: CreationMethod
  onCancel: () => void
}

export interface AssessmentData {
  name: string
  description: string
  passingScore: number
  retryLimit: number
  timeLimitSeconds?: number
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  showFeedback: boolean
  showCorrectAnswers: boolean
}

export interface Question {
  id: string
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options: string[]
  correctAnswer: string | string[] | boolean
  explanation: string
  points: number
  position: number
}

type Step = 'details' | 'generation' | 'questions' | 'preview'

interface StepConfig {
  id: Step
  title: string
  description: string
  icon?: React.ReactNode
}

interface GenerationData {
  type: CreationMethod
  contentId?: string
  youtubeUrl?: string
  prompt?: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes: string[]
}

export function AssessmentBuilder({ creationMethod, onCancel }: AssessmentBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    name: '',
    description: '',
    passingScore: 70,
    retryLimit: 3,
    randomizeQuestions: false,
    randomizeAnswers: true,
    showFeedback: true,
    showCorrectAnswers: true,
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const steps: StepConfig[] = [
    { id: 'details', title: 'Assessment Details', description: 'Basic information about the assessment' },
    ...(creationMethod !== 'manual' ? [{ id: 'generation' as Step, title: 'AI Generation', description: 'Generate questions automatically', icon: <Wand2 className="w-4 h-4" /> }] : []),
    { id: 'questions', title: 'Questions', description: 'Create and manage questions' },
    { id: 'preview', title: 'Preview & Publish', description: 'Review and save assessment', icon: <Eye className="w-4 h-4" /> },
  ]

  // Auto-advance to appropriate step based on creation method
  useEffect(() => {
    if (creationMethod !== 'manual' && currentStep === 'details') {
      // Don't auto-advance, let user navigate manually
    }
  }, [creationMethod, currentStep])

  const handleGenerateQuestions = async (generationData: GenerationData) => {
    setIsGenerating(true)
    try {
      // TODO: Call API to generate questions
      console.log('Generating questions with:', generationData)
      
      // Mock generated questions
      const mockQuestions: Question[] = [
        {
          id: '1',
          type: 'multiple_choice',
          question: 'What is the main concept discussed in the content?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is the correct answer because...',
          points: 1,
          position: 0
        },
        {
          id: '2',
          type: 'true_false',
          question: 'The content emphasizes the importance of teamwork.',
          options: [],
          correctAnswer: true,
          explanation: 'The content clearly states that teamwork is essential.',
          points: 1,
          position: 1
        }
      ]
      
      setQuestions(mockQuestions)
      setCompletedSteps(prev => new Set([...prev, 'generation']))
      setCurrentStep('questions')
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAssessment = async () => {
    setIsSaving(true)
    try {
      // TODO: Call API to save assessment
      console.log('Saving assessment:', { assessmentData, questions })
      // Redirect to assessments list on success
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishAssessment = async () => {
    await handleSaveAssessment()
    // TODO: Publish the assessment
    console.log('Publishing assessment')
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
                    placeholder="e.g., Company Culture & Values"
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
                      min="1"
                      max="100"
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
                      min="1"
                      max="10"
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
                      onCheckedChange={(checked) => 
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
                      onCheckedChange={(checked) => 
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
                      onCheckedChange={(checked) => 
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
                      onCheckedChange={(checked) => 
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
                const newQuestion: Question = {
                  id: Date.now().toString(),
                  type: 'multiple_choice',
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: '',
                  explanation: '',
                  points: 1,
                  position: questions.length
                }
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
              onClick={handleSaveAssessment}
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
