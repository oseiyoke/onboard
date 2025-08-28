import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { unstable_cache, revalidateTag } from 'next/cache'
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
  score: z.number().min(0).max(100).nullable().optional(),
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

export interface ParticipantEnrollment {
  id: string
  flow_id: string
  flow: {
    id: string
    name: string
    description: string | null
  }
  status: string
  started_at: string
  completed_at: string | null
  progress: {
    completed_items: number
    total_items: number
    percentage: number
  }
}

// Helper to determine if we're running on the server or client
function isServer() {
  return typeof window === 'undefined'
}

// Helper to get the appropriate Supabase client
async function getSupabaseClient() {
  if (isServer()) {
    return await createServerClient()
  } else {
    return createBrowserClient()
  }
}

export class ProgressService {
  async getUserFlowProgress(userId: string, enrollmentId: string): Promise<UserFlowProgress | null> {
    const supabase = await getSupabaseClient()
    
    const fetchProgress = async () => {
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

        const flowData = enrollment.flow as unknown as { name: string } | { name: string }[] | null
        const flowName = flowData 
          ? (Array.isArray(flowData) ? flowData[0]?.name : flowData.name)
          : undefined

        return {
          enrollment_id: enrollment.id,
          flow_id: enrollment.flow_id,
          flow_title: flowName || 'Untitled Flow',
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
    }

    // Use caching only on server side
    if (isServer()) {
      return await unstable_cache(
        fetchProgress,
        [`progress-${userId}-${enrollmentId}`],
        {
          revalidate: 60, // Cache for 1 minute
          tags: [`user-progress-${userId}`, `enrollment-${enrollmentId}`],
        }
      )()
    } else {
      return await fetchProgress()
    }
  }

  async markStageStarted(data: CreateStageProgress): Promise<StageProgress> {
    const validated = CreateStageProgressSchema.parse(data)
    const supabase = await getSupabaseClient()

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

    // Invalidate caches to ensure fresh data
    if (isServer()) {
      await revalidateTag(`progress-${validated.user_id}-${validated.enrollment_id}`)
      await revalidateTag(`user-progress-${validated.user_id}`)
      await revalidateTag(`enrollment-${validated.enrollment_id}`)
    }

    return progress as StageProgress
  }

  async markStageCompleted(userId: string, stageId: string, enrollmentId: string): Promise<StageProgress> {
    const supabase = await getSupabaseClient()

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

    // Invalidate caches to ensure fresh data
    if (isServer()) {
      await revalidateTag(`progress-${userId}-${enrollmentId}`)
      await revalidateTag(`user-progress-${userId}`)
      await revalidateTag(`enrollment-${enrollmentId}`)
    }

    return progress as StageProgress
  }

  async markStageItemCompleted(data: CreateStageItemProgress): Promise<StageItemProgress> {
    const validated = CreateStageItemProgressSchema.parse(data)
    const supabase = await getSupabaseClient()

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

    // Invalidate caches to ensure fresh data
    if (isServer()) {
      await revalidateTag(`progress-${validated.user_id}-${validated.enrollment_id}`)
      await revalidateTag(`user-progress-${validated.user_id}`)
      await revalidateTag(`enrollment-${validated.enrollment_id}`)
    }

    return progress as StageItemProgress
  }

  private async checkAndCompleteStage(userId: string, enrollmentId: string, stageItemId: string): Promise<void> {
    const supabase = await getSupabaseClient()

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
    const supabase = await getSupabaseClient()

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

      // Check if this flow should promote participant to member
      const { data: flow } = await supabase
        .from('onboard_flows')
        .select('promote_to_member')
        .eq('id', enrollment.flow_id)
        .single()

      if (flow?.promote_to_member) {
        await supabase
          .from('onboard_users')
          .update({ member: true })
          .eq('id', userId)
      }

      // Invalidate caches to ensure fresh data
      if (isServer()) {
        await revalidateTag(`progress-${userId}-${enrollmentId}`)
        await revalidateTag(`user-progress-${userId}`)
        await revalidateTag(`enrollment-${enrollmentId}`)
      }
    }
  }

  async getFlowProgressSummary(flowId: string): Promise<{
    total_enrolled: number
    total_completed: number
    completion_rate: number
    avg_completion_time_hours: number | null
  }> {
    const supabase = await getSupabaseClient()

    const fetchSummary = async () => {
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
    }

    // Use caching only on server side
    if (isServer()) {
      return await unstable_cache(
        fetchSummary,
        [`flow-summary-${flowId}`],
        {
          revalidate: 300, // Cache for 5 minutes
          tags: [`flow-${flowId}`, 'flow-progress'],
        }
      )()
    } else {
      return await fetchSummary()
    }
  }

  // Participant-specific methods
  async getParticipantEnrollments(): Promise<ParticipantEnrollment[]> {
    const response = await fetch('/api/progress/enrollments')
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollments')
    }
    
    const data = await response.json()
    // API returns { enrollments: [...] }
    return data.enrollments
  }

  async startStage(stageId: string, enrollmentId: string): Promise<void> {
    const response = await fetch(`/api/progress/stages/${stageId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to start stage')
    }
  }

  async completeStageItem(itemId: string, enrollmentId: string, score?: number): Promise<void> {
    const response = await fetch(`/api/progress/stage-items/${itemId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        ...(score !== undefined && { score }),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to complete stage item')
    }
  }

  async getEnrollmentProgress(enrollmentId: string): Promise<UserFlowProgress | null> {
    const response = await fetch(`/api/progress/enrollments/${enrollmentId}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    // API returns { progress: {...} }
    return data.progress
  }
}

// Export singleton instance
export const progressService = new ProgressService()
