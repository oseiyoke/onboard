import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { CACHE_TAGS } from '@/lib/utils/cache-invalidation'

// Schemas
export const CreateStageSchema = z.object({
  flow_id: z.string().uuid(),
  title: z.string().min(1, 'Stage title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  position: z.number().int().min(0),
  settings: z.record(z.unknown()).optional(),
})

export const UpdateStageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  position: z.number().int().min(0).optional(),
  settings: z.record(z.unknown()).optional(),
})

export const ReorderStagesSchema = z.object({
  stages: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0)
  }))
})

// Types
export type CreateStage = z.infer<typeof CreateStageSchema>
export type UpdateStage = z.infer<typeof UpdateStageSchema>
export type ReorderStages = z.infer<typeof ReorderStagesSchema>

export interface Stage {
  id: string
  flow_id: string
  title: string
  description: string | null
  image_url: string | null
  position: number
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface StageWithItems extends Stage {
  items: StageItem[]
}

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

export class StageService {
  async getStagesByFlowId(flowId: string): Promise<StageWithItems[]> {
    const supabase = await createClient()
    
    return await unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from('onboard_stages')
          .select(`
            *,
            items:onboard_stage_items(*)
          `)
          .eq('flow_id', flowId)
          .order('position', { ascending: true })

        if (error) {
          console.error('Stage fetch error:', error)
          throw new Error('Failed to fetch stages')
        }

        // Sort items by position within each stage
        return (data as StageWithItems[]).map(stage => ({
          ...stage,
          items: stage.items.sort((a, b) => a.position - b.position)
        }))
      },
      [`stages-${flowId}`],
      {
        revalidate: 300,
        tags: [CACHE_TAGS.FLOW(flowId), 'stages'],
      }
    )()
  }

  async getStageById(stageId: string): Promise<StageWithItems | null> {
    const supabase = await createClient()
    
    return await unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from('onboard_stages')
          .select(`
            *,
            items:onboard_stage_items(*)
          `)
          .eq('id', stageId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return null // Not found
          }
          console.error('Stage fetch error:', error)
          throw new Error('Failed to fetch stage')
        }

        // Sort items by position
        const stage = data as StageWithItems
        stage.items = stage.items.sort((a, b) => a.position - b.position)

        return stage
      },
      [`stage-${stageId}`],
      {
        revalidate: 300,
        tags: [`stage-${stageId}`, 'stages'],
      }
    )()
  }

  async createStage(data: CreateStage): Promise<Stage> {
    const validated = CreateStageSchema.parse(data)
    const supabase = await createClient()

    const { data: stage, error } = await supabase
      .from('onboard_stages')
      .insert({
        id: crypto.randomUUID(),
        ...validated,
      })
      .select()
      .single()

    if (error) {
      console.error('Stage creation error:', error)
      throw new Error('Failed to create stage')
    }

    return stage as Stage
  }

  async updateStage(stageId: string, data: UpdateStage): Promise<Stage> {
    const validated = UpdateStageSchema.parse(data)
    const supabase = await createClient()

    const { data: stage, error } = await supabase
      .from('onboard_stages')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .select()
      .single()

    if (error) {
      console.error('Stage update error:', error)
      throw new Error('Failed to update stage')
    }

    return stage as Stage
  }

  async deleteStage(stageId: string): Promise<void> {
    const supabase = await createClient()

    // Get stage info for reordering
    const { data: stageToDelete } = await supabase
      .from('onboard_stages')
      .select('flow_id, position')
      .eq('id', stageId)
      .single()

    if (!stageToDelete) {
      throw new Error('Stage not found')
    }

    // Delete the stage (cascade will handle items)
    const { error: deleteError } = await supabase
      .from('onboard_stages')
      .delete()
      .eq('id', stageId)

    if (deleteError) {
      console.error('Stage deletion error:', deleteError)
      throw new Error('Failed to delete stage')
    }

    // Reorder remaining stages
    const { error: reorderError } = await supabase.rpc('reorder_stages_after_delete', {
      p_flow_id: stageToDelete.flow_id,
      p_deleted_position: stageToDelete.position
    })

    if (reorderError) {
      console.warn('Stage reorder warning:', reorderError)
      // Don't throw - deletion succeeded, reordering is less critical
    }
  }

  async reorderStages(flowId: string, reorderData: ReorderStages): Promise<void> {
    const validated = ReorderStagesSchema.parse(reorderData)
    const supabase = await createClient()

    // Update positions in a transaction-like batch
    const updates = validated.stages.map(({ id, position }) => 
      supabase
        .from('onboard_stages')
        .update({ position, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('flow_id', flowId) // Extra safety check
    )

    const results = await Promise.allSettled(updates)
    const failures = results.filter(result => result.status === 'rejected')

    if (failures.length > 0) {
      console.error('Stage reorder errors:', failures)
      throw new Error('Failed to reorder some stages')
    }
  }

  async duplicateStage(stageId: string, newFlowId?: string): Promise<StageWithItems> {
    const originalStage = await this.getStageById(stageId)
    if (!originalStage) {
      throw new Error('Stage not found')
    }

    // Get next position in target flow
    const targetFlowId = newFlowId || originalStage.flow_id
    const stages = await this.getStagesByFlowId(targetFlowId)
    const nextPosition = stages.length

    // Create new stage
    const newStage = await this.createStage({
      flow_id: targetFlowId,
      title: `${originalStage.title} (Copy)`,
      description: originalStage.description || undefined,
      image_url: originalStage.image_url || undefined,
      position: nextPosition,
      settings: originalStage.settings,
    })

    // Duplicate items using StageItemService
    const { StageItemService } = await import('./stage-item.service')
    const itemService = new StageItemService()

    const duplicatedItems: StageItem[] = []
    for (const item of originalStage.items) {
      const duplicatedItem = await itemService.createStageItem({
        stage_id: newStage.id,
        type: item.type,
        title: item.title,
        position: item.position,
        content_id: item.content_id || undefined,
        assessment_id: item.assessment_id || undefined,
        body: item.body || undefined,
        settings: item.settings,
      })
      duplicatedItems.push(duplicatedItem)
    }

    return {
      ...newStage,
      items: duplicatedItems
    }
  }
}

// Export singleton instance
export const stageService = new StageService()
