import type { CreateAssessment, CreateQuestion, Assessment, Question as ApiQuestion } from '@/lib/services/assessment.service'
import type { GeneratedQuestion } from '@/lib/api/assessment'

// UI types from the component
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
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay' | 'file_upload'
  question: string
  options: string[]
  correctAnswer: any
  explanation: string
  points: number
  position: number
}

/**
 * Check if a string is a valid UUID
 */
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Convert UI AssessmentData to API CreateAssessment format
 */
export function uiAssessmentToApi(
  data: AssessmentData, 
  generationType: 'manual' | 'content' | 'prompt' | 'youtube' = 'manual',
  generationSource?: { contentId?: string; prompt?: string; youtubeUrl?: string }
): CreateAssessment {
  const assessment: CreateAssessment = {
    name: data.name,
    description: data.description || undefined,
    passing_score: data.passingScore,
    retry_limit: data.retryLimit,
    time_limit_seconds: data.timeLimitSeconds || undefined,
    randomize_questions: data.randomizeQuestions,
    randomize_answers: data.randomizeAnswers,
    show_feedback: data.showFeedback,
    show_correct_answers: data.showCorrectAnswers,
    settings: {}
  }

  // Add generation source if not manual
  if (generationType !== 'manual') {
    const mappedType: 'content' | 'prompt' = generationType === 'youtube' ? 'content' : generationType
    assessment.generation_source = {
      type: mappedType,
      ...(generationSource?.contentId && { content_id: generationSource.contentId }),
      ...(generationSource?.prompt && { prompt: generationSource.prompt })
    }
    assessment.settings = {
      ai_generated: true,
      ...(generationSource?.youtubeUrl && { youtube_url: generationSource.youtubeUrl })
    }
  } else {
    assessment.generation_source = { type: 'manual' }
  }

  return assessment
}

/**
 * Convert UI Question to API CreateQuestion format
 */
export function uiQuestionToApi(question: Question): CreateQuestion & { id?: string } {
  const baseQuestion = {
    type: question.type as any,
    question: question.question,
    options: question.options,
    correct_answer: question.correctAnswer,
    explanation: question.explanation || undefined,
    points: question.points,
    position: question.position,
    metadata: {}
  }

  // Preserve UUID ids for existing questions
  if (question.id && isUuid(question.id)) {
    return { ...baseQuestion, id: question.id }
  }

  return baseQuestion
}

/**
 * Convert multiple UI Questions to API CreateQuestion format
 */
export function uiQuestionsToApi(questions: Question[]): CreateQuestion[] {
  return questions.map(uiQuestionToApi)
}

/**
 * Convert API generated questions to UI Question format
 */
export function apiGeneratedQuestionToUi(generatedQuestion: GeneratedQuestion, index: number): Question {
  return {
    id: `generated_${Date.now()}_${index}`,
    type: generatedQuestion.type as any,
    question: generatedQuestion.question,
    options: generatedQuestion.options || [],
    correctAnswer: generatedQuestion.correct_answer,
    explanation: generatedQuestion.explanation || '',
    points: 1,
    position: index
  }
}

/**
 * Convert multiple API generated questions to UI Question format
 */
export function apiGeneratedQuestionsToUi(generatedQuestions: GeneratedQuestion[]): Question[] {
  return generatedQuestions.map(apiGeneratedQuestionToUi)
}

/**
 * Create a new empty question with defaults
 */
export function createEmptyQuestion(position: number): Question {
  return {
    id: `question_${Date.now()}_${position}`,
    type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
    position
  }
}

/**
 * Convert API Assessment to UI Assessment format (for the assessments list page)
 */
export function apiAssessmentToUi(assessment: Assessment): {
  id: string
  name: string
  description: string
  questionCount: number
  passingScore: number
  attempts: number
  avgScore: number
  isPublished: boolean
  generationType: 'manual' | 'content'
  createdAt: string
  updatedAt: string
} {
  return {
    id: assessment.id,
    name: assessment.name,
    description: assessment.description || '',
    questionCount: 0, // Will be populated by aggregation query
    passingScore: assessment.passing_score,
    attempts: 0, // Will be populated by aggregation query
    avgScore: 0, // Will be populated by aggregation query
    isPublished: assessment.is_published,
    generationType: assessment.generation_source?.type === 'content' ? 'content' : 'manual',
    createdAt: assessment.created_at,
    updatedAt: assessment.updated_at
  }
}

/**
 * Convert API Assessment to UI AssessmentData format (for editing)
 */
export function apiAssessmentToUiData(assessment: Assessment): AssessmentData {
  return {
    name: assessment.name,
    description: assessment.description || '',
    passingScore: assessment.passing_score,
    retryLimit: assessment.retry_limit,
    timeLimitSeconds: assessment.time_limit_seconds,
    randomizeQuestions: assessment.randomize_questions,
    randomizeAnswers: assessment.randomize_answers,
    showFeedback: assessment.show_feedback,
    showCorrectAnswers: assessment.show_correct_answers
  }
}

/**
 * Convert API Question to UI Question format
 */
export function apiQuestionToUi(question: ApiQuestion): Question {
  return {
    id: question.id,
    type: question.type,
    question: question.question,
    options: question.options || [],
    correctAnswer: question.correct_answer,
    explanation: question.explanation || '',
    points: question.points,
    position: question.position
  }
}

/**
 * Validate that an assessment has all required fields for saving
 */
export function validateAssessmentForSave(data: AssessmentData, questions: Question[]): string | null {
  if (!data.name.trim()) {
    return 'Assessment name is required'
  }
  
  if (questions.length === 0) {
    return 'At least one question is required'
  }
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    if (!question.question.trim()) {
      return `Question ${i + 1} text is required`
    }
    
    // Essay and short_answer questions don't require a correct answer
    if (!['essay', 'short_answer'].includes(question.type) && (!question.correctAnswer || question.correctAnswer === '')) {
      return `Question ${i + 1} must have a correct answer`
    }
    
    if ((question.type === 'multiple_choice' || question.type === 'multi_select') && 
        question.options.filter(opt => opt.trim()).length < 2) {
      return `Question ${i + 1} must have at least 2 answer options`
    }
  }
  
  return null
}
