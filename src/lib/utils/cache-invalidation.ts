import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Cache invalidation utilities for the application
 */

// Cache tags for different data types
export const CACHE_TAGS = {
  FLOWS: 'flows',
  FLOW: (id: string) => `flow-${id}`,
  USER_FLOWS: (orgId: string) => `user-flows-${orgId}`,
  CONTENT: 'content',
  USER_CONTENT: (orgId: string) => `user-content-${orgId}`,
  DASHBOARD: (orgId: string) => `dashboard-${orgId}`,
} as const

/**
 * Invalidate flows cache for an organization
 */
export async function invalidateFlowsCache(orgId: string) {
  revalidateTag(CACHE_TAGS.FLOWS)
  revalidateTag(CACHE_TAGS.USER_FLOWS(orgId))
  revalidateTag(CACHE_TAGS.DASHBOARD(orgId))
  revalidatePath('/dashboard/flows')
}

/**
 * Invalidate a specific flow cache
 */
export async function invalidateFlowCache(flowId: string, orgId: string) {
  revalidateTag(CACHE_TAGS.FLOW(flowId))
  revalidateTag(CACHE_TAGS.USER_FLOWS(orgId))
  revalidateTag(CACHE_TAGS.DASHBOARD(orgId))
  revalidatePath(`/dashboard/flows/${flowId}/edit`)
  revalidatePath('/dashboard/flows')
}

/**
 * Invalidate content cache for an organization
 */
export async function invalidateContentCache(orgId: string) {
  revalidateTag(CACHE_TAGS.CONTENT)
  revalidateTag(CACHE_TAGS.USER_CONTENT(orgId))
  revalidatePath('/dashboard/content')
}

/**
 * Invalidate dashboard cache for an organization
 */
export async function invalidateDashboardCache(orgId: string) {
  revalidateTag(CACHE_TAGS.DASHBOARD(orgId))
  revalidatePath('/dashboard')
}
