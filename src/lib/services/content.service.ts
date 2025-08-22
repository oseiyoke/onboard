import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

export const CreateContentSchema = z.object({
  name: z.string().min(1, 'Content name is required').max(255, 'Name too long'),
  type: z.enum(['pdf', 'video', 'image', 'document', 'other']),
  file_url: z.string().url('Invalid file URL'),
  file_size: z.number().positive('File size must be positive'),
  metadata: z.record(z.unknown()).optional().default({}),
})

export const ContentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.enum(['pdf', 'video', 'image', 'document', 'other']).optional(),
})

export type CreateContent = z.infer<typeof CreateContentSchema>
export type ContentQuery = z.infer<typeof ContentQuerySchema>

export interface Content {
  id: string
  org_id: string
  name: string
  type: string
  file_url: string
  file_size: number
  metadata: Record<string, unknown>
  created_at: string
  created_by: string
}

export class ContentService {
  private supabase = createClient()

  async getContentByOrg(orgId: string, query: ContentQuery = {}): Promise<{
    content: Content[]
    total: number
    page: number
    limit: number
  }> {
    const { page, limit, search, type } = ContentQuerySchema.parse(query)
    const offset = (page - 1) * limit

    let queryBuilder = this.supabase
      .from('onboard_content')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (search) {
      queryBuilder = queryBuilder.ilike('name', `%${search}%`)
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type)
    }

    const { data, error, count } = await queryBuilder
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Content fetch error:', error)
      throw new Error('Failed to fetch content')
    }

    return {
      content: data as Content[],
      total: count || 0,
      page,
      limit,
    }
  }

  async getContentById(contentId: string, orgId: string): Promise<Content | null> {
    const { data, error } = await this.supabase
      .from('onboard_content')
      .select('*')
      .eq('id', contentId)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Content fetch error:', error)
      throw new Error('Failed to fetch content')
    }

    return data as Content
  }

  async createContent(orgId: string, userId: string, data: CreateContent): Promise<Content> {
    const validated = CreateContentSchema.parse(data)

    const { data: content, error } = await this.supabase
      .from('onboard_content')
      .insert({
        org_id: orgId,
        name: validated.name,
        type: validated.type,
        file_url: validated.file_url,
        file_size: validated.file_size,
        metadata: validated.metadata,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Content creation error:', error)
      throw new Error('Failed to create content')
    }

    return content as Content
  }

  async deleteContent(contentId: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('onboard_content')
      .delete()
      .eq('id', contentId)
      .eq('org_id', orgId)

    if (error) {
      console.error('Content deletion error:', error)
      throw new Error('Failed to delete content')
    }
  }
}

// Export singleton instance
export const contentService = new ContentService()
