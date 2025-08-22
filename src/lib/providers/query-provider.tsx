'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Longer stale time for better performance
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000,   // 10 minutes (was cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error && 'status' in error && typeof error.status === 'number') {
                return error.status >= 500 && failureCount < 2
              }
              return failureCount < 2
            },
          },
          mutations: {
            retry: false, // Don't retry mutations by default
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
