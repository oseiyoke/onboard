import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Cache invalidation utilities for the application
 */

// Cache tags for different data types
export const CACHE_TAGS = {
  FLOWS: 'flows',
  FLOW: (id: string) => `flow-${id}`,
  USER_FLOWS: 'user-flows',
  CONTENT: 'content',
  USER_CONTENT: 'user-content',
  DASHBOARD: 'dashboard',
} as const

/**
 * Invalidate flows cache for an organization
 */
export async function invalidateFlowsCache() {
  revalidateTag(CACHE_TAGS.FLOWS)
  revalidateTag(CACHE_TAGS.USER_FLOWS)
  revalidateTag(CACHE_TAGS.DASHBOARD)
  revalidatePath('/dashboard/flows')
}

/**
 * Invalidate a specific flow cache
 */
export async function invalidateFlowCache(flowId: string) {
  revalidateTag(CACHE_TAGS.FLOW(flowId))
  revalidateTag(CACHE_TAGS.USER_FLOWS)
  revalidateTag(CACHE_TAGS.DASHBOARD)
  revalidatePath(`/dashboard/flows/${flowId}/edit`)
  revalidatePath('/dashboard/flows')
}

/**
 * Invalidate content cache for an organization
 */
export async function invalidateContentCache() {
  revalidateTag(CACHE_TAGS.CONTENT)
  revalidateTag(CACHE_TAGS.USER_CONTENT)
  revalidatePath('/dashboard/content')
}

/**
 * Invalidate dashboard cache for an organization
 */
export async function invalidateDashboardCache() {
  revalidateTag(CACHE_TAGS.DASHBOARD)
  revalidatePath('/dashboard')
}
