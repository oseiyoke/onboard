import type { CreateAssessment, CreateQuestion } from '@/lib/services/assessment.service'

export interface GenerateAssessmentRequest {
  type?: 'content' | 'prompt'
  contentId?: string
  prompt?: string
  youtubeUrl?: string
  assessmentConfig: {
    name: string
    description?: string
    questionCount?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    questionTypes?: string[]
    passingScore?: number
  }
}

export interface GeneratedQuestion {
  type: string
  question: string
  options: string[]
  correct_answer: any
  explanation: string
  difficulty?: string
  ai_generated?: boolean
}

export interface GenerateAssessmentResponse {
  result: {
    assessment: CreateAssessment
    questions: GeneratedQuestion[]
    sourceText?: string
  }
  message: string
}

export interface AssessmentResponse {
  assessment: {
    id: string
    name: string
    description?: string
    passing_score: number
    retry_limit: number
    time_limit_seconds?: number
    randomize_questions: boolean
    randomize_answers: boolean
    show_feedback: boolean
    show_correct_answers: boolean
    is_published: boolean
    created_at: string
    updated_at: string
  }
}

export interface QuestionResponse {
  question: {
    id: string
    assessment_id: string
    type: string
    question: string
    options: string[]
    correct_answer: any
    explanation?: string
    points: number
    position: number
    created_at: string
  }
}

/**
 * Generate questions using AI from content, prompt, or YouTube URL
 */
export async function generateAssessment(request: GenerateAssessmentRequest): Promise<GenerateAssessmentResponse> {
  let payload: any

  if (request.youtubeUrl) {
    // YouTube generation
    payload = {
      youtubeUrl: request.youtubeUrl,
      assessmentConfig: request.assessmentConfig
    }
  } else {
    // Content or prompt generation
    payload = {
      type: request.type,
      contentId: request.contentId,
      prompt: request.prompt,
      assessmentConfig: request.assessmentConfig
    }
  }

  const response = await fetch('/api/assessments/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate assessment' }))
    throw new Error(error.message || 'Failed to generate assessment')
  }

  return response.json()
}

/**
 * Create a new assessment draft
 */
export async function createAssessment(data: CreateAssessment): Promise<AssessmentResponse> {
  const response = await fetch('/api/assessments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create assessment' }))
    throw new Error(error.message || 'Failed to create assessment')
  }

  return response.json()
}

/**
 * Add a question to an assessment
 */
export async function createQuestion(assessmentId: string, data: CreateQuestion): Promise<QuestionResponse> {
  const response = await fetch(`/api/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create question' }))
    throw new Error(error.message || 'Failed to create question')
  }

  return response.json()
}

/**
 * Create multiple questions for an assessment
 */
export async function createQuestions(assessmentId: string, questions: CreateQuestion[]): Promise<QuestionResponse[]> {
  const results = []
  
  for (const questionData of questions) {
    const result = await createQuestion(assessmentId, questionData)
    results.push(result)
  }
  
  return results
}

/**
 * Publish an assessment
 */
export async function publishAssessment(assessmentId: string): Promise<AssessmentResponse> {
  const response = await fetch(`/api/assessments/${assessmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_published: true }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to publish assessment' }))
    throw new Error(error.message || 'Failed to publish assessment')
  }

  return response.json()
}

/**
 * Update an assessment
 */
export async function updateAssessment(assessmentId: string, data: Partial<CreateAssessment>): Promise<AssessmentResponse> {
  const response = await fetch(`/api/assessments/${assessmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update assessment' }))
    throw new Error(error.message || 'Failed to update assessment')
  }

  return response.json()
}
