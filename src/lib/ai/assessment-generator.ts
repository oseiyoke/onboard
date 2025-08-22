import { OpenAI } from 'openai'
import { contentService, type Content } from '@/lib/services/content.service'
import { assessmentService, type CreateAssessment, type CreateQuestion } from '@/lib/services/assessment.service'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIGenerationRequest {
  type: 'prompt' | 'content'
  contentId?: string  // For existing content
  prompt?: string     // For prompt-based generation
  assessmentConfig: {
    name: string
    description?: string
    questionCount?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    questionTypes?: string[]
    passingScore?: number
  }
}

export interface AIGenerationResult {
  assessment: CreateAssessment
  questions: CreateQuestion[]
  sourceText?: string
}

export class AssessmentGeneratorService {
  
  async generateAssessment(
    userId: string,
    request: AIGenerationRequest
  ): Promise<AIGenerationResult> {
    let sourceText = ''
    let generationSource: any = {}

    if (request.type === 'content' && request.contentId) {
      // Extract text from existing content
      const content = await contentService.getContentById(request.contentId)
      if (!content) {
        throw new Error('Content not found')
      }
      
      sourceText = await this.extractTextFromContent(content)
      generationSource = {
        type: 'content',
        content_id: request.contentId
      }
    } else if (request.type === 'prompt' && request.prompt) {
      // Use prompt directly as context
      sourceText = request.prompt
      generationSource = {
        type: 'prompt',
        prompt: request.prompt
      }
    } else {
      throw new Error('Invalid generation request: missing contentId or prompt')
    }

    if (!sourceText.trim()) {
      throw new Error('No text content available for assessment generation')
    }

    // Generate questions using AI
    const questions = await this.generateQuestionsFromText(sourceText, request.assessmentConfig)

    // Create assessment object
    const assessment: CreateAssessment = {
      name: request.assessmentConfig.name,
      description: request.assessmentConfig.description || `AI-generated assessment from ${request.type}`,
      passing_score: request.assessmentConfig.passingScore || 70,
      generation_source: generationSource,
      settings: {
        ai_generated: true,
        generation_config: request.assessmentConfig
      }
    }

    return {
      assessment,
      questions,
      sourceText: sourceText.substring(0, 500) + (sourceText.length > 500 ? '...' : '')
    }
  }

  async generateFromYoutube(
    userId: string,
    youtubeUrl: string,
    assessmentConfig: AIGenerationRequest['assessmentConfig']
  ): Promise<AIGenerationResult> {
    // First create a content record for this YouTube video
    const content = await contentService.createContent(userId, {
      name: assessmentConfig.name + ' (YouTube Video)',
      type: 'video',
      source: 'youtube',
      external_url: youtubeUrl,
      metadata: { generated_for_assessment: true }
    })

    // Then generate assessment from this content
    return this.generateAssessment(userId, {
      type: 'content',
      contentId: content.id,
      assessmentConfig
    })
  }

  private async extractTextFromContent(content: Content): Promise<string> {
    try {
      switch (content.type) {
        case 'pdf':
          return await this.extractTextFromPDF(content)
        case 'document':
          return await this.extractTextFromDocument(content)
        case 'video':
          return await this.extractTextFromVideo(content)
        default:
          throw new Error(`Unsupported content type for text extraction: ${content.type}`)
      }
    } catch (error) {
      console.error('Text extraction error:', error)
      throw new Error(`Failed to extract text from ${content.type} content`)
    }
  }

  private async extractTextFromPDF(content: Content): Promise<string> {
    // For R2 uploads, we'd need to fetch the file and extract text
    // For now, we'll return placeholder text and a note about implementation
    if (content.source === 'upload' && content.file_url) {
      // TODO: Implement PDF text extraction
      // This would involve:
      // 1. Fetch PDF from R2 using signed URL
      // 2. Use pdf-parse or similar library to extract text
      // 3. Clean and format the text
      return `[PDF content extraction not yet implemented for: ${content.name}]\n\nPlease use the manual creation option or provide a text prompt describing the content you want to create an assessment for.`
    }
    
    if (content.source === 'external' && content.external_url) {
      // For external PDFs, same process but fetch from external URL
      return `[External PDF content extraction not yet implemented for: ${content.name}]\n\nPlease provide a text prompt describing the PDF content you want to create an assessment for.`
    }

    return ''
  }

  private async extractTextFromDocument(content: Content): Promise<string> {
    // Similar to PDF extraction
    // TODO: Implement document text extraction for DOCX, PPT, etc.
    return `[Document content extraction not yet implemented for: ${content.name}]\n\nPlease use the manual creation option or provide a text prompt describing the content you want to create an assessment for.`
  }

  private async extractTextFromVideo(content: Content): Promise<string> {
    if (content.source === 'youtube' && content.external_url) {
      // For YouTube videos, we can extract transcript
      return await this.extractYouTubeTranscript(content.external_url)
    }

    // For other video sources
    return `[Video transcript extraction not yet implemented for: ${content.name}]\n\nPlease provide a text prompt describing the video content you want to create an assessment for.`
  }

  private async extractYouTubeTranscript(youtubeUrl: string): Promise<string> {
    // TODO: Implement YouTube transcript extraction
    // This could use:
    // 1. YouTube Transcript API
    // 2. YouTube Data API v3
    // 3. Third-party transcript services
    
    // For now, return a placeholder that explains the limitation
    return `[YouTube transcript extraction not yet implemented]\n\nFor YouTube video: ${youtubeUrl}\n\nPlease provide a text prompt describing the video content you want to create an assessment for.`
  }

  private async generateQuestionsFromText(
    text: string,
    config: AIGenerationRequest['assessmentConfig']
  ): Promise<CreateQuestion[]> {
    const questionCount = config.questionCount || 5
    const difficulty = config.difficulty || 'medium'
    const questionTypes = config.questionTypes || ['multiple_choice', 'true_false']

    const prompt = this.buildAssessmentPrompt(text, {
      questionCount,
      difficulty,
      questionTypes
    })

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator who creates high-quality assessment questions. Always respond with valid JSON only, no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI service')
      }

      // Parse the JSON response
      const questionsData = JSON.parse(response)
      
      // Convert to CreateQuestion format
      const questions: CreateQuestion[] = questionsData.questions.map((q: any, index: number) => ({
        type: q.type,
        question: q.question,
        options: q.options || [],
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        points: 1,
        position: index,
        metadata: {
          difficulty: q.difficulty || difficulty,
          ai_generated: true
        }
      }))

      return questions

    } catch (error) {
      console.error('AI question generation error:', error)
      throw new Error('Failed to generate questions using AI')
    }
  }

  private buildAssessmentPrompt(
    text: string,
    config: {
      questionCount: number
      difficulty: string
      questionTypes: string[]
    }
  ): string {
    const questionTypesInstructions = {
      multiple_choice: 'Multiple choice questions with 4 options (A, B, C, D) where only one is correct',
      multi_select: 'Multiple select questions where multiple answers can be correct',
      true_false: 'True/false questions with clear factual statements',
      short_answer: 'Short answer questions expecting 1-3 word responses'
    }

    const typeInstructions = config.questionTypes
      .map(type => `- ${questionTypesInstructions[type as keyof typeof questionTypesInstructions]}`)
      .join('\n')

    return `
Based on the following content, create ${config.questionCount} assessment questions at ${config.difficulty} difficulty level.

CONTENT:
${text}

REQUIREMENTS:
- Generate exactly ${config.questionCount} questions
- Use these question types:
${typeInstructions}
- Difficulty level: ${config.difficulty}
- Questions should test understanding, not just memorization
- Include brief explanations for correct answers
- Ensure questions are clear and unambiguous

RESPONSE FORMAT:
Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "What is the main concept discussed?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "medium"
    }
  ]
}

For different question types:
- multiple_choice: correct_answer is a string (the correct option text)
- multi_select: correct_answer is an array of strings (multiple correct options)
- true_false: correct_answer is boolean (true or false)
- short_answer: correct_answer is a string (the expected answer)

Generate the assessment now:`
  }
}

// Export singleton instance
export const assessmentGenerator = new AssessmentGeneratorService()
