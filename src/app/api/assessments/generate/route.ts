import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/api/errors'
import { assessmentGenerator, type AIGenerationRequest } from '@/lib/ai/assessment-generator'
import { z } from 'zod'

const GenerateAssessmentSchema = z.object({
  type: z.enum(['prompt', 'content']),
  contentId: z.string().uuid().optional(),
  prompt: z.string().optional(),
  assessmentConfig: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    questionCount: z.number().min(1).max(50).default(5),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    questionTypes: z.array(z.enum(['multiple_choice', 'multi_select', 'true_false', 'short_answer'])).default(['multiple_choice', 'true_false']),
    passingScore: z.number().min(0).max(100).default(70),
  })
}).refine((data) => {
  if (data.type === 'content') {
    return !!data.contentId
  }
  if (data.type === 'prompt') {
    return !!data.prompt
  }
  return false
}, {
  message: 'contentId required for content type, prompt required for prompt type'
})

const GenerateFromYouTubeSchema = z.object({
  youtubeUrl: z.string().url(),
  assessmentConfig: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    questionCount: z.number().min(1).max(50).default(5),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    questionTypes: z.array(z.enum(['multiple_choice', 'multi_select', 'true_false', 'short_answer'])).default(['multiple_choice', 'true_false']),
    passingScore: z.number().min(0).max(100).default(70),
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAdmin(request)
  
  const body = await request.json()
  
  // Check if this is a YouTube generation request
  if (body.youtubeUrl) {
    const data = GenerateFromYouTubeSchema.parse(body)
    
    const result = await assessmentGenerator.generateFromYoutube(
      user.id,
      data.youtubeUrl,
      data.assessmentConfig
    )
    
    return createSuccessResponse(
      { 
        result,
        message: 'Assessment generated from YouTube video'
      },
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    )
  }
  
  // Regular content/prompt generation
  const data = GenerateAssessmentSchema.parse(body)
  
  const request_data: AIGenerationRequest = {
    type: data.type,
    contentId: data.contentId,
    prompt: data.prompt,
    assessmentConfig: data.assessmentConfig
  }
  
  const result = await assessmentGenerator.generateAssessment(user.id, request_data)
  
  return createSuccessResponse(
    { 
      result,
      message: `Assessment generated from ${data.type}`
    },
    { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache',
      },
    }
  )
})
