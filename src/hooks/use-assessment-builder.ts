'use client'

import { useState, useCallback } from 'react'
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
  isUuid,
  type AssessmentData,
  type Question
} from '@/lib/utils/assessment-mapper'

type CreationMethod = 'manual' | 'content' | 'youtube' | 'prompt'

interface UseAssessmentBuilderProps {
  mode?: 'create' | 'edit'
  creationMethod?: CreationMethod
  assessmentId?: string
  initialData?: AssessmentData
  initialQuestions?: Question[]
  isPublished?: boolean
  onCancel: () => void
}

export function useAssessmentBuilder({
  mode = 'create',
  creationMethod = 'manual',
  assessmentId,
  initialData,
  initialQuestions,
  isPublished = false,
  onCancel
}: UseAssessmentBuilderProps) {
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

  // Update assessment data
  const updateAssessmentData = useCallback((updates: Partial<AssessmentData>) => {
    setAssessmentData(prev => ({ ...prev, ...updates }))
  }, [])

  // Generate questions using AI
  const handleGenerateQuestions = useCallback(async (generationData: {
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
      let request
      
      if (generationData.type === 'youtube' || generationData.youtubeUrl) {
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
      toast.success(`Generated ${uiQuestions.length} questions successfully!`)
      
      return uiQuestions
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions')
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [assessmentData])

  // Save assessment
  const handleSaveAssessment = useCallback(async (publish = false) => {
    const validationError = validateAssessmentForSave(assessmentData, questions)
    if (validationError) {
      toast.error(validationError)
      return null
    }

    setIsSaving(true)
    try {
      let currentAssessmentId = savedAssessmentId

      // Create or update assessment
      if (!currentAssessmentId) {
        const generationType: 'manual' | 'content' | 'prompt' | 'youtube' = lastGenerationSource?.type || 'manual'
        const apiAssessment = uiAssessmentToApi(
          assessmentData,
          generationType,
          lastGenerationSource || undefined
        )

        const assessmentResponse = await createAssessment(apiAssessment)
        currentAssessmentId = assessmentResponse.assessment.id
        setSavedAssessmentId(currentAssessmentId)
      } else {
        const generationType: 'manual' | 'content' | 'prompt' | 'youtube' = lastGenerationSource?.type || 'manual'
        const apiAssessment = uiAssessmentToApi(
          assessmentData,
          generationType,
          lastGenerationSource || undefined
        )

        await updateAssessment(currentAssessmentId, apiAssessment)
      }

      // Handle questions
      if (questions.length > 0 && currentAssessmentId) {
        const newQuestions = questions.filter(q => !isUuid(q.id))
        const existingQuestions = questions.filter(q => isUuid(q.id))

        // Create new questions
        if (newQuestions.length > 0) {
          const apiNewQuestions = uiQuestionsToApi(newQuestions)
          await createQuestions(currentAssessmentId, apiNewQuestions)
        }

        // Update existing questions
        if (existingQuestions.length > 0) {
          await Promise.all(
            existingQuestions.map(async (question) => {
              if (isUuid(question.id)) {
                const apiQuestion = uiQuestionsToApi([question])[0]
                delete (apiQuestion as Record<string, unknown>).id
                await updateQuestion(question.id, apiQuestion)
              }
            })
          )
        }
      }

      // Publish if requested
      if (publish && currentAssessmentId) {
        await publishAssessment(currentAssessmentId)
        toast.success('Assessment published successfully!')
        
        setTimeout(() => {
          window.location.href = '/dashboard/assessments'
        }, 1000)
      } else {
        toast.success('Assessment saved as draft!')
      }

      return currentAssessmentId
    } catch (error) {
      console.error('Save failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save assessment')
      return null
    } finally {
      setIsSaving(false)
    }
  }, [assessmentData, questions, savedAssessmentId, lastGenerationSource])

  // Validation
  const validateStep = useCallback((stepId: string): boolean | string => {
    console.log("validateStep", stepId)
    switch (stepId) {
      case 'details':
        if (!assessmentData.name.trim()) {
          return 'Assessment name is required'
        }
        console.log("assessmentData.name", assessmentData.name)
        return true
        
      case 'questions':
        if (questions.length === 0) {
          return 'At least one question is required'
        }
        
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i]
          if (!question.question.trim()) {
            return `Question ${i + 1} text is required`
          }
          
          if (!['essay', 'short_answer'].includes(question.type) && 
              (!question.correctAnswer || question.correctAnswer === '')) {
            return `Question ${i + 1} must have a correct answer`
          }
        }
        return true
        
      case 'preview':
        return assessmentData.name && questions.length > 0
        
      default:
        return true
    }
  }, [assessmentData, questions])

  const isReadyToSave = assessmentData.name && questions.length > 0

  return {
    // State
    assessmentData,
    questions,
    isGenerating,
    isSaving,
    savedAssessmentId,
    isReadyToSave,

    // Actions
    updateAssessmentData,
    setQuestions,
    handleGenerateQuestions,
    handleSaveAssessment,
    validateStep,

    // Configuration
    mode,
    creationMethod,
    isPublished,
    onCancel
  }
}
