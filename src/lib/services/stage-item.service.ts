import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

// Schemas
export const CreateStageItemSchema = z.object({
  stage_id: z.string().uuid(),
  type: z.enum(['content', 'assessment', 'info']),
  title: z.string().min(1, 'Item title is required').max(200, 'Title too long'),
  position: z.number().int().min(0),
  content_id: z.string().uuid().optional(),
  assessment_id: z.string().uuid().optional(),
  body: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
}).refine((data) => {
  // Ensure proper type-specific references
  if (data.type === 'content') {
    return !!data.content_id && !data.assessment_id && !data.body
  }
  if (data.type === 'assessment') {
    return !!data.assessment_id && !data.content_id && !data.body
  }
  if (data.type === 'info') {
    return !!data.body && !data.content_id && !data.assessment_id
  }
  return false
}, {
  message: "Item type must have corresponding reference (content_id, assessment_id, or body)"
})

export const UpdateStageItemSchema = z.object({
  type: z.enum(['content', 'assessment', 'info']).optional(),
  title: z.string().min(1).max(200).optional(),
  position: z.number().int().min(0).optional(),
  content_id: z.string().uuid().optional(),
  assessment_id: z.string().uuid().optional(),
  body: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
})

export const ReorderStageItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0)
  }))
})

// Types
export type CreateStageItem = z.infer<typeof CreateStageItemSchema>
export type UpdateStageItem = z.infer<typeof UpdateStageItemSchema>
export type ReorderStageItems = z.infer<typeof ReorderStageItemsSchema>

export interface StageItem {
  id: string
  stage_id: string
  type: 'content' | 'assessment' | 'info'
  title: string
  position: number
  content_id: string | null
  assessment_id: string | null
  body: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface StageItemWithRelations extends StageItem {
  content?: {
    id: string
    name: string
    type: string
    file_url: string | null
  }
  assessment?: {
    id: string
    name: string
    passing_score: number
    question_count?: number
  }
}

export class StageItemService {
  async getStageItems(stageId: string): Promise<StageItemWithRelations[]> {
    const supabase = await createClient()
    
    return await unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from('onboard_stage_items')
          .select(`
            *,
            content:onboard_content(id, name, type, file_url),
            assessment:onboard_assessments(id, name, passing_score)
          `)
          .eq('stage_id', stageId)
          .order('position', { ascending: true })

        if (error) {
          console.error('Stage items fetch error:', error)
          throw new Error('Failed to fetch stage items')
        }

        return data as StageItemWithRelations[]
      },
      [`stage-items-${stageId}`],
      {
        revalidate: 300,
        tags: [`stage-${stageId}`, 'stage-items'],
      }
    )()
  }

  async getStageItemById(itemId: string): Promise<StageItemWithRelations | null> {
    const supabase = await createClient()
    
    return await unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from('onboard_stage_items')
          .select(`
            *,
            content:onboard_content(id, name, type, file_url),
            assessment:onboard_assessments(id, name, passing_score)
          `)
          .eq('id', itemId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return null // Not found
          }
          console.error('Stage item fetch error:', error)
          throw new Error('Failed to fetch stage item')
        }

        return data as StageItemWithRelations
      },
      [`stage-item-${itemId}`],
      {
        revalidate: 300,
        tags: [`stage-item-${itemId}`, 'stage-items'],
      }
    )()
  }

  async createStageItem(data: CreateStageItem): Promise<StageItem> {
    const validated = CreateStageItemSchema.parse(data)
    const supabase = await createClient()

    const { data: item, error } = await supabase
      .from('onboard_stage_items')
      .insert({
        id: crypto.randomUUID(),
        ...validated,
        settings: validated.settings || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Stage item creation error:', error)
      throw new Error('Failed to create stage item')
    }

    return item as StageItem
  }

  async updateStageItem(itemId: string, data: UpdateStageItem): Promise<StageItem> {
    const validated = UpdateStageItemSchema.parse(data)
    const supabase = await createClient()

    // If changing type, validate that the correct references are provided
    if (validated.type) {
      if (validated.type === 'content' && !validated.content_id) {
        throw new Error('Content ID required for content items')
      }
      if (validated.type === 'assessment' && !validated.assessment_id) {
        throw new Error('Assessment ID required for assessment items')
      }
      if (validated.type === 'info' && !validated.body) {
        throw new Error('Body text required for info items')
      }
    }

    const { data: item, error } = await supabase
      .from('onboard_stage_items')
      .update(validated)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Stage item update error:', error)
      throw new Error('Failed to update stage item')
    }

    return item as StageItem
  }

  async deleteStageItem(itemId: string): Promise<void> {
    const supabase = await createClient()

    // Get item info for reordering
    const { data: itemToDelete } = await supabase
      .from('onboard_stage_items')
      .select('stage_id, position')
      .eq('id', itemId)
      .single()

    if (!itemToDelete) {
      throw new Error('Stage item not found')
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('onboard_stage_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      console.error('Stage item deletion error:', deleteError)
      throw new Error('Failed to delete stage item')
    }

    // Reorder remaining items
    await this.reorderItemsAfterDelete(itemToDelete.stage_id, itemToDelete.position)
  }

  async reorderStageItems(stageId: string, reorderData: ReorderStageItems): Promise<void> {
    const validated = ReorderStageItemsSchema.parse(reorderData)
    const supabase = await createClient()

    // Update positions in batch
    const updates = validated.items.map(({ id, position }) => 
      supabase
        .from('onboard_stage_items')
        .update({ position })
        .eq('id', id)
        .eq('stage_id', stageId) // Extra safety check
    )

    const results = await Promise.allSettled(updates)
    const failures = results.filter(result => result.status === 'rejected')

    if (failures.length > 0) {
      console.error('Stage item reorder errors:', failures)
      throw new Error('Failed to reorder some stage items')
    }
  }

  private async reorderItemsAfterDelete(stageId: string, deletedPosition: number): Promise<void> {
    const supabase = await createClient()

    // Update positions of items that came after the deleted item
    const { error } = await supabase
      .from('onboard_stage_items')
      .update({ position: supabase.raw('position - 1') })
      .eq('stage_id', stageId)
      .gt('position', deletedPosition)

    if (error) {
      console.warn('Stage item reorder warning:', error)
      // Don't throw - deletion succeeded, reordering is less critical
    }
  }

  async duplicateStageItem(itemId: string, targetStageId?: string): Promise<StageItem> {
    const originalItem = await this.getStageItemById(itemId)
    if (!originalItem) {
      throw new Error('Stage item not found')
    }

    // Get next position in target stage
    const stageId = targetStageId || originalItem.stage_id
    const items = await this.getStageItems(stageId)
    const nextPosition = items.length

    // Create new item
    return this.createStageItem({
      stage_id: stageId,
      type: originalItem.type,
      title: `${originalItem.title} (Copy)`,
      position: nextPosition,
      content_id: originalItem.content_id || undefined,
      assessment_id: originalItem.assessment_id || undefined,
      body: originalItem.body || undefined,
      settings: originalItem.settings,
    })
  }

  // Utility method to get next available position
  async getNextPosition(stageId: string): Promise<number> {
    const items = await this.getStageItems(stageId)
    return items.length
  }

  // Bulk create items (useful for migrations)
  async createMultipleStageItems(items: CreateStageItem[]): Promise<StageItem[]> {
    const supabase = await createClient()
    
    const itemsToInsert = items.map(item => ({
      id: crypto.randomUUID(),
      ...CreateStageItemSchema.parse(item),
      settings: item.settings || {},
    }))

    const { data, error } = await supabase
      .from('onboard_stage_items')
      .insert(itemsToInsert)
      .select()

    if (error) {
      console.error('Bulk stage items creation error:', error)
      throw new Error('Failed to create stage items')
    }

    return data as StageItem[]
  }
}

// Export singleton instance
export const stageItemService = new StageItemService()
