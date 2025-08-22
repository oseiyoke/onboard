import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { CACHE_TAGS } from '@/lib/utils/cache-invalidation'

export const CreateFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required').max(100, 'Name too long'),
  description: z.string().optional(),
})

export const UpdateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  flow_data: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
})

export const FlowQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  active: z.boolean().optional(),
})

export type CreateFlow = z.infer<typeof CreateFlowSchema>
export type UpdateFlow = z.infer<typeof UpdateFlowSchema>
export type FlowQuery = z.infer<typeof FlowQuerySchema>

export interface Flow {
  id: string
  name: string
  description: string | null
  flow_data: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  org_id: string
}

export class FlowService {
  async getFlowsByOrg(orgId: string, query: FlowQuery = {}): Promise<{
    flows: Flow[]
    total: number
    page: number
    limit: number
  }> {
    const parsedQuery = FlowQuerySchema.parse(query)
    
    // Create cache key based on orgId and query parameters
    const cacheKey = `flows-${orgId}-${JSON.stringify(parsedQuery)}`
    // Create Supabase client outside the cached scope to avoid calling dynamic
    // APIs (cookies()) inside unstable_cache which is disallowed by Next.js.
    const supabase = await createClient()
    
    return await unstable_cache(
      async () => {
        const { page, limit, search, active } = parsedQuery
        const offset = (page - 1) * limit

        let queryBuilder = supabase
          .from('onboard_flows')
          .select('*', { count: 'exact' })
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })

        if (search) {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${search}%,description.ilike.%${search}%`
          )
        }

        if (active !== undefined) {
          queryBuilder = queryBuilder.eq('is_active', active)
        }

        const { data, error, count } = await queryBuilder
          .range(offset, offset + limit - 1)

        if (error) {
          console.error('Flow fetch error:', error)
          throw new Error('Failed to fetch flows')
        }

        return {
          flows: data as Flow[],
          total: count || 0,
          page,
          limit,
        }
      },
      [cacheKey],
      {
        revalidate: 300, // 5 minutes
        tags: [CACHE_TAGS.FLOWS, CACHE_TAGS.USER_FLOWS(orgId)],
      }
    )()
  }

  async getFlowById(flowId: string, orgId: string): Promise<Flow | null> {
    // Create Supabase client outside the cached scope for the same reason as above
    const supabase = await createClient()
    return await unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from('onboard_flows')
          .select('*')
          .eq('id', flowId)
          .eq('org_id', orgId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return null // Not found
          }
          console.error('Flow fetch error:', error)
          throw new Error('Failed to fetch flow')
        }

        return data as Flow
      },
      [`flow-${flowId}-${orgId}`],
      {
        revalidate: 300, // 5 minutes
        tags: [CACHE_TAGS.FLOW(flowId), CACHE_TAGS.USER_FLOWS(orgId)],
      }
    )()
  }

  async createFlow(orgId: string, userId: string, data: CreateFlow): Promise<Flow> {
    const validated = CreateFlowSchema.parse(data)
    const flowId = crypto.randomUUID()

    const { data: flow, error } = await createClient()
      .from('onboard_flows')
      .insert({
        id: flowId,
        org_id: orgId,
        name: validated.name,
        description: validated.description || null,
        flow_data: {
          nodes: [
            {
              id: 'start',
              type: 'start',
              position: { x: 250, y: 50 },
              data: { label: 'Start' }
            }
          ],
          edges: []
        },
        is_active: false,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Flow creation error:', error)
      throw new Error('Failed to create flow')
    }

    return flow as Flow
  }

  async updateFlow(flowId: string, orgId: string, data: UpdateFlow): Promise<Flow> {
    const validated = UpdateFlowSchema.parse(data)

    const { data: flow, error } = await createClient()
      .from('onboard_flows')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flowId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Flow update error:', error)
      throw new Error('Failed to update flow')
    }

    return flow as Flow
  }

  async deleteFlow(flowId: string, orgId: string): Promise<void> {
    const { error } = await createClient()
      .from('onboard_flows')
      .delete()
      .eq('id', flowId)
      .eq('org_id', orgId)

    if (error) {
      console.error('Flow deletion error:', error)
      throw new Error('Failed to delete flow')
    }
  }

  async duplicateFlow(flowId: string, orgId: string, userId: string): Promise<Flow> {
    const originalFlow = await this.getFlowById(flowId, orgId)
    if (!originalFlow) {
      throw new Error('Flow not found')
    }

    return this.createFlow(orgId, userId, {
      name: `${originalFlow.name} (Copy)`,
      description: originalFlow.description || undefined,
    })
  }
}

// Export singleton instance
export const flowService = new FlowService()
