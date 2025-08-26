import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

// Schemas
export const CreateStageProgressSchema = z.object({
  user_id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  stage_id: z.string().uuid(),
})

export const CreateStageItemProgressSchema = z.object({
  user_id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  stage_item_id: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const GetProgressQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid().optional(),
  flow_id: z.string().uuid().optional(),
})

// Types
export type CreateStageProgress = z.infer<typeof CreateStageProgressSchema>
export type CreateStageItemProgress = z.infer<typeof CreateStageItemProgressSchema>
export type GetProgressQuery = z.infer<typeof GetProgressQuerySchema>

export interface StageProgress {
  id: string
  user_id: string
  enrollment_id: string
  stage_id: string
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface StageItemProgress {
  id: string
  user_id: string
  enrollment_id: string
  stage_item_id: string
  score: number | null
  completed_at: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface UserFlowProgress {
  enrollment_id: string
  flow_id: string
  flow_title: string
  started_at: string
  completed_at: string | null
  stages: {
    stage_id: string
    stage_title: string
    stage_position: number
    started_at: string | null
    completed_at: string | null
    items: {
      item_id: string
      item_title: string
      item_type: 'content' | 'assessment' | 'info'
      item_position: number
      completed_at: string | null
      score: number | null
    }[]
  }[]
}

export class ProgressService {
  async getUserFlowProgress(userId: string, enrollmentId: string): Promise<UserFlowProgress | null> {
    const supabase = await createClient()
    
    return await unstable_cache(
      async () => {
        // Get enrollment with flow info
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('onboard_enrollments')
          .select(`
            id,
            flow_id,
            started_at,
            completed_at,
            flow:onboard_flows(name)
          `)
          .eq('id', enrollmentId)
          .eq('user_id', userId)
          .single()

        if (enrollmentError || !enrollment) {
          return null
        }

        // Get stages with their items and progress
        const { data: stages, error: stagesError } = await supabase
          .from('onboard_stages')
          .select(`
            id,
            title,
            position,
            stage_progress:onboard_stage_progress!left(started_at, completed_at),
            items:onboard_stage_items(
              id,
              title,
              type,
              position,
              item_progress:onboard_stage_item_progress!left(completed_at, score)
            )
          `)
          .eq('flow_id', enrollment.flow_id)
          .eq('stage_progress.user_id', userId)
          .eq('stage_progress.enrollment_id', enrollmentId)
          .eq('items.item_progress.user_id', userId)
          .eq('items.item_progress.enrollment_id', enrollmentId)
          .order('position', { ascending: true })

        if (stagesError) {
          console.error('Stages progress fetch error:', stagesError)
          throw new Error('Failed to fetch progress')
        }

        return {
          enrollment_id: enrollment.id,
          flow_id: enrollment.flow_id,
          flow_title: (enrollment.flow as any)?.name || 'Untitled Flow',
          started_at: enrollment.started_at,
          completed_at: enrollment.completed_at,
          stages: stages.map(stage => ({
            stage_id: stage.id,
            stage_title: stage.title,
            stage_position: stage.position,
            started_at: stage.stage_progress[0]?.started_at || null,
            completed_at: stage.stage_progress[0]?.completed_at || null,
            items: stage.items
              .sort((a, b) => a.position - b.position)
              .map(item => ({
                item_id: item.id,
                item_title: item.title,
                item_type: item.type,
                item_position: item.position,
                completed_at: item.item_progress[0]?.completed_at || null,
                score: item.item_progress[0]?.score || null,
              }))
          }))
        } as UserFlowProgress
      },
      [`progress-${userId}-${enrollmentId}`],
      {
        revalidate: 60, // Cache for 1 minute
        tags: [`user-progress-${userId}`, `enrollment-${enrollmentId}`],
      }
    )()
  }

  async markStageStarted(data: CreateStageProgress): Promise<StageProgress> {
    const validated = CreateStageProgressSchema.parse(data)
    const supabase = await createClient()

    const { data: progress, error } = await supabase
      .from('onboard_stage_progress')
      .upsert({
        ...validated,
        started_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,stage_id,enrollment_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Stage progress creation error:', error)
      throw new Error('Failed to mark stage as started')
    }

    return progress as StageProgress
  }

  async markStageCompleted(userId: string, stageId: string, enrollmentId: string): Promise<StageProgress> {
    const supabase = await createClient()

    const { data: progress, error } = await supabase
      .from('onboard_stage_progress')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('stage_id', stageId)
      .eq('enrollment_id', enrollmentId)
      .select()
      .single()

    if (error) {
      console.error('Stage completion error:', error)
      throw new Error('Failed to mark stage as completed')
    }

    return progress as StageProgress
  }

  async markStageItemCompleted(data: CreateStageItemProgress): Promise<StageItemProgress> {
    const validated = CreateStageItemProgressSchema.parse(data)
    const supabase = await createClient()

    const { data: progress, error } = await supabase
      .from('onboard_stage_item_progress')
      .upsert({
        ...validated,
        completed_at: new Date().toISOString(),
        metadata: validated.metadata || {},
      }, {
        onConflict: 'user_id,stage_item_id,enrollment_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Stage item progress creation error:', error)
      throw new Error('Failed to mark stage item as completed')
    }

    // Check if this completes the stage
    await this.checkAndCompleteStage(
      validated.user_id,
      validated.enrollment_id,
      validated.stage_item_id
    )

    return progress as StageItemProgress
  }

  private async checkAndCompleteStage(userId: string, enrollmentId: string, stageItemId: string): Promise<void> {
    const supabase = await createClient()

    // Get the stage for this item
    const { data: stageItem } = await supabase
      .from('onboard_stage_items')
      .select('stage_id')
      .eq('id', stageItemId)
      .single()

    if (!stageItem) return

    // Check if all items in this stage are completed
    const { data: allItems } = await supabase
      .from('onboard_stage_items')
      .select(`
        id,
        progress:onboard_stage_item_progress!left(completed_at)
      `)
      .eq('stage_id', stageItem.stage_id)
      .eq('progress.user_id', userId)
      .eq('progress.enrollment_id', enrollmentId)

    if (!allItems) return

    const allCompleted = allItems.every(item => 
      item.progress && item.progress.length > 0 && item.progress[0].completed_at
    )

    if (allCompleted) {
      // Mark stage as completed
      await this.markStageCompleted(userId, stageItem.stage_id, enrollmentId)
      
      // Check if this completes the entire flow
      await this.checkAndCompleteFlow(userId, enrollmentId)
    }
  }

  private async checkAndCompleteFlow(userId: string, enrollmentId: string): Promise<void> {
    const supabase = await createClient()

    // Get enrollment to find flow_id
    const { data: enrollment } = await supabase
      .from('onboard_enrollments')
      .select('flow_id')
      .eq('id', enrollmentId)
      .single()

    if (!enrollment) return

    // Check if all stages in this flow are completed
    const { data: allStages } = await supabase
      .from('onboard_stages')
      .select(`
        id,
        progress:onboard_stage_progress!left(completed_at)
      `)
      .eq('flow_id', enrollment.flow_id)
      .eq('progress.user_id', userId)
      .eq('progress.enrollment_id', enrollmentId)

    if (!allStages) return

    const allCompleted = allStages.every(stage => 
      stage.progress && stage.progress.length > 0 && stage.progress[0].completed_at
    )

    if (allCompleted) {
      // Mark enrollment as completed
      await supabase
        .from('onboard_enrollments')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId)
    }
  }

  async getFlowProgressSummary(flowId: string): Promise<{
    total_enrolled: number
    total_completed: number
    completion_rate: number
    avg_completion_time_hours: number | null
  }> {
    const supabase = await createClient()

    return await unstable_cache(
      async () => {
        const { data: summary, error } = await supabase.rpc('get_flow_progress_summary', {
          p_flow_id: flowId
        })

        if (error) {
          console.error('Flow progress summary error:', error)
          throw new Error('Failed to get flow progress summary')
        }

        return summary[0] || {
          total_enrolled: 0,
          total_completed: 0,
          completion_rate: 0,
          avg_completion_time_hours: null
        }
      },
      [`flow-summary-${flowId}`],
      {
        revalidate: 300, // Cache for 5 minutes
        tags: [`flow-${flowId}`, 'flow-progress'],
      }
    )()
  }
}

// Export singleton instance
export const progressService = new ProgressService()
