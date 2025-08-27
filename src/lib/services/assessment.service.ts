import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Schemas
export const CreateAssessmentSchema = z.object({
  org_id: z.string().uuid().optional(), // Optional since database will set default
  name: z.string().min(1, 'Assessment name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  passing_score: z.number().min(0).max(100).default(70),
  retry_limit: z.number().min(0).default(3),
  time_limit_seconds: z.number().positive().optional(),
  randomize_questions: z.boolean().default(false),
  randomize_answers: z.boolean().default(true),
  show_feedback: z.boolean().default(true),
  show_correct_answers: z.boolean().default(true),
  generation_source: z.object({
    type: z.enum(['manual', 'prompt', 'content']),
    content_id: z.string().uuid().optional(),
    prompt: z.string().optional(),
  }).optional(),
  settings: z.record(z.unknown()).default({}),
  is_published: z.boolean().optional(),
})

export const CreateQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'multi_select', 'true_false', 'short_answer', 'essay', 'file_upload']),
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).default([]),
  correct_answer: z.unknown(), // Flexible to handle different answer types
  explanation: z.string().optional(),
  points: z.number().min(0).default(1),
  position: z.number().min(0),
  metadata: z.record(z.unknown()).default({}),
})

export const UpdateAssessmentSchema = CreateAssessmentSchema.partial()
export const UpdateQuestionSchema = CreateQuestionSchema.partial()

export const AssessmentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  is_published: z.coerce.boolean().optional(),
})

export const SubmitAttemptSchema = z.object({
  answers: z.record(z.unknown()), // questionId -> answer mapping
  time_spent_seconds: z.number().min(0).default(0),
})

// Types
export type CreateAssessment = z.infer<typeof CreateAssessmentSchema>
export type UpdateAssessment = z.infer<typeof UpdateAssessmentSchema>
export type CreateQuestion = z.infer<typeof CreateQuestionSchema>
export type UpdateQuestion = z.infer<typeof UpdateQuestionSchema>
export type AssessmentQuery = z.infer<typeof AssessmentQuerySchema>
export type SubmitAttempt = z.infer<typeof SubmitAttemptSchema>

export interface Assessment {
  id: string
  org_id: string
  name: string
  description?: string
  passing_score: number
  retry_limit: number
  time_limit_seconds?: number
  randomize_questions: boolean
  randomize_answers: boolean
  show_feedback: boolean
  show_correct_answers: boolean
  generation_source?: {
    type: 'manual' | 'prompt' | 'content'
    content_id?: string
    prompt?: string
  }
  settings: Record<string, unknown>
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  assessment_id: string
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer' | 'essay' | 'file_upload'
  question: string
  options: string[]
  correct_answer: unknown
  explanation?: string
  points: number
  position: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface AssessmentAttempt {
  id: string
  assessment_id: string
  user_id: string
  enrollment_id?: string
  score?: number
  max_score?: number
  time_spent_seconds: number
  answers: Record<string, unknown>
  is_passed: boolean
  started_at: string
  completed_at?: string
  created_at: string
}

export interface AssessmentWithQuestions extends Assessment {
  questions: Question[]
}

export class AssessmentService {
  
  async getAssessments(query?: Partial<AssessmentQuery>): Promise<{
    assessments: Assessment[]
    total: number
    page: number
    limit: number
  }> {
    const { page, limit, search, is_published } = AssessmentQuerySchema.parse(query ?? {})
    const offset = (page - 1) * limit

    const supabase = await createClient()
    
    // Get assessments with aggregated stats
    let queryBuilder = supabase
      .from('onboard_assessments')
      .select(`
        *,
        questions:onboard_questions(id),
        attempts:onboard_assessment_attempts(id, score, max_score)
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })

    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (is_published !== undefined) {
      queryBuilder = queryBuilder.eq('is_published', is_published)
    }

    const { data, error, count } = await queryBuilder
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Assessment fetch error:', error)
      throw new Error('Failed to fetch assessments')
    }

    // Enhance assessments with computed metrics
    const assessmentsWithMetrics = (data || []).map((assessment: Assessment & { 
      questions?: { id: string }[],
      attempts?: { id: string, score?: number, max_score?: number }[]
    }) => {
      const questionCount = assessment.questions?.length || 0
      const attempts = assessment.attempts?.length || 0
      let avgScore = 0
      
      if (attempts > 0) {
        const totalScore = assessment.attempts!.reduce((sum: number, attempt) => {
          if (attempt.max_score && attempt.max_score > 0) {
            return sum + ((attempt.score || 0) / attempt.max_score) * 100
          }
          return sum
        }, 0)
        avgScore = Math.round(totalScore / attempts)
      }

      // Return clean assessment object without the nested relations
      const { questions: _, attempts: __, ...cleanAssessment } = assessment
      // Suppress unused variable warnings as we need to destructure to remove these fields
      void _; void __; 
      
      return {
        ...cleanAssessment,
        questionCount,
        attempts,
        avgScore
      }
    })

    return {
      assessments: assessmentsWithMetrics as Assessment[],
      total: count || 0,
      page,
      limit,
    }
  }

  async getAssessmentById(assessmentId: string, includeQuestions = false): Promise<Assessment | AssessmentWithQuestions | null> {
    const supabase = await createClient()
    
    let query = supabase
      .from('onboard_assessments')
      .select('*')
      .eq('id', assessmentId)
    if (includeQuestions) {
      query = supabase
        .from('onboard_assessments')
        .select(`
          *,
          questions:onboard_questions(*)
        `)
        .eq('id', assessmentId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Assessment fetch error:', error)
      throw new Error('Failed to fetch assessment')
    }

    if (includeQuestions && data.questions) {
      // Sort questions by position
      data.questions.sort((a: Question, b: Question) => a.position - b.position)
    }

    return data as Assessment | AssessmentWithQuestions
  }

  async createAssessment(userId: string, data: CreateAssessment): Promise<Assessment> {
    const validated = CreateAssessmentSchema.parse(data)

    const supabase = await createClient()
    
    // Get the user's org_id from the database
    const { data: userData, error: userError } = await supabase
      .from('onboard_users')
      .select('org_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('Failed to get user organization:', userError)
      throw new Error('Failed to get user organization')
    }

    const { data: assessment, error } = await supabase
      .from('onboard_assessments')
      .insert({
        ...validated,
        org_id: userData.org_id,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Assessment creation error:', error)
      throw new Error('Failed to create assessment')
    }

    return assessment as Assessment
  }

  async updateAssessment(assessmentId: string, data: UpdateAssessment): Promise<Assessment> {
    const validated = UpdateAssessmentSchema.parse(data)

    const supabase = await createClient()
    const { data: assessment, error } = await supabase
      .from('onboard_assessments')
      .update(validated)
      .eq('id', assessmentId)
      .select()
      .single()

    if (error) {
      console.error('Assessment update error:', error)
      throw new Error('Failed to update assessment')
    }

    return assessment as Assessment
  }

  async deleteAssessment(assessmentId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('onboard_assessments')
      .delete()
      .eq('id', assessmentId)

    if (error) {
      console.error('Assessment deletion error:', error)
      throw new Error('Failed to delete assessment')
    }
  }

  async publishAssessment(assessmentId: string): Promise<Assessment> {
    return this.updateAssessment(assessmentId, { is_published: true })
  }

  async unpublishAssessment(assessmentId: string): Promise<Assessment> {
    return this.updateAssessment(assessmentId, { is_published: false })
  }

  // Question Management
  async createQuestion(assessmentId: string, data: CreateQuestion): Promise<Question> {
    const validated = CreateQuestionSchema.parse(data)

    const supabase = await createClient()
    const { data: question, error } = await supabase
      .from('onboard_questions')
      .insert({
        ...validated,
        assessment_id: assessmentId,
      })
      .select()
      .single()

    if (error) {
      console.error('Question creation error:', error)
      throw new Error('Failed to create question')
    }

    return question as Question
  }

  async updateQuestion(questionId: string, data: UpdateQuestion): Promise<Question> {
    const validated = UpdateQuestionSchema.parse(data)

    const supabase = await createClient()
    const { data: question, error } = await supabase
      .from('onboard_questions')
      .update(validated)
      .eq('id', questionId)
      .select()
      .single()

    if (error) {
      console.error('Question update error:', error)
      throw new Error('Failed to update question')
    }

    return question as Question
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('onboard_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Question deletion error:', error)
      throw new Error('Failed to delete question')
    }
  }

  async reorderQuestions(assessmentId: string, questionIds: string[]): Promise<void> {
    const supabase = await createClient()
    
    // Update positions in batch
    const updates = questionIds.map((questionId, index) => ({
      id: questionId,
      position: index,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('onboard_questions')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('assessment_id', assessmentId) // Extra safety

      if (error) {
        console.error('Question reorder error:', error)
        throw new Error('Failed to reorder questions')
      }
    }
  }

  // Assessment Attempts
  async createAttempt(assessmentId: string, userId: string, enrollmentId?: string): Promise<AssessmentAttempt> {
    const supabase = await createClient()
    const { data: attempt, error } = await supabase
      .from('onboard_assessment_attempts')
      .insert({
        assessment_id: assessmentId,
        user_id: userId,
        enrollment_id: enrollmentId,
        answers: {},
      })
      .select()
      .single()

    if (error) {
      console.error('Assessment attempt creation error:', error)
      throw new Error('Failed to create assessment attempt')
    }

    return attempt as AssessmentAttempt
  }

  async submitAttempt(attemptId: string, data: SubmitAttempt): Promise<AssessmentAttempt> {
    const validated = SubmitAttemptSchema.parse(data)

    // Get the assessment and its questions to calculate score
    const supabase = await createClient()
    const { data: attempt, error: attemptError } = await supabase
      .from('onboard_assessment_attempts')
      .select(`
        *,
        assessment:onboard_assessments(
          *,
          questions:onboard_questions(*)
        )
      `)
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      throw new Error('Assessment attempt not found')
    }

    // Calculate score
    const { score, maxScore, isPassed } = this.calculateScore(
      attempt.assessment,
      validated.answers
    )

    // Update the attempt
    const { data: updatedAttempt, error } = await supabase
      .from('onboard_assessment_attempts')
      .update({
        answers: validated.answers,
        time_spent_seconds: validated.time_spent_seconds,
        score,
        max_score: maxScore,
        is_passed: isPassed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (error) {
      console.error('Assessment attempt submission error:', error)
      throw new Error('Failed to submit assessment attempt')
    }

    return updatedAttempt as AssessmentAttempt
  }

  async getAttemptsByUser(userId: string, assessmentId?: string): Promise<AssessmentAttempt[]> {
    const supabase = await createClient()
    let query = supabase
      .from('onboard_assessment_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (assessmentId) {
      query = query.eq('assessment_id', assessmentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Assessment attempts fetch error:', error)
      throw new Error('Failed to fetch assessment attempts')
    }

    return data as AssessmentAttempt[]
  }

  private calculateScore(assessment: AssessmentWithQuestions, answers: Record<string, unknown>): {
    score: number
    maxScore: number
    isPassed: boolean
  } {
    const questions = assessment.questions || []
    let totalPoints = 0
    let earnedPoints = 0

    questions.forEach((question: Question) => {
      totalPoints += question.points
      const userAnswer = answers[question.id]

      if (this.isCorrectAnswer(question, userAnswer)) {
        earnedPoints += question.points
      }
    })

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    const isPassed = score >= assessment.passing_score

    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      maxScore: totalPoints,
      isPassed,
    }
  }

  private isCorrectAnswer(question: Question, userAnswer: unknown): boolean {
    const correctAnswer = question.correct_answer

    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
      case 'short_answer':
        return userAnswer === correctAnswer

      case 'multi_select':
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
          return false
        }
        return userAnswer.length === correctAnswer.length &&
               userAnswer.every(answer => correctAnswer.includes(answer))

      case 'essay':
      case 'file_upload':
        // These need manual grading, so we return false by default
        // In practice, admins would update the score manually
        return false

      default:
        return false
    }
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService()
