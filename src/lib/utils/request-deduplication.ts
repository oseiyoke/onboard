/**
 * Request deduplication utilities using Next.js cache() function
 * and Map-based cache for client-side deduplication
 */

// Client-side request cache
const requestCache = new Map<string, Promise<unknown>>()

/**
 * Deduplicate API requests on the client side
 */
export function dedupeRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 5000 // 5 seconds default TTL
): Promise<T> {
  // Check if we already have a pending request
  const existingRequest = requestCache.get(key)
  if (existingRequest) {
    return existingRequest
  }

  // Create new request
  const request = requestFn().finally(() => {
    // Clean up after TTL
    setTimeout(() => {
      requestCache.delete(key)
    }, ttl)
  })

  requestCache.set(key, request)
  return request
}

/**
 * Create a cache key for API requests
 */
export function createCacheKey(
  endpoint: string,
  params?: Record<string, unknown>
): string {
  if (!params) return endpoint
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&')
  
  return `${endpoint}?${sortedParams}`
}

/**
 * Clear all cached requests
 */
export function clearRequestCache(): void {
  requestCache.clear()
}

/**
 * Clear specific cached request
 */
export function clearCachedRequest(key: string): void {
  requestCache.delete(key)
}
