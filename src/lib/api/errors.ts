import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export interface ApiErrorResponse {
  error: string
  code?: string
  errors?: Record<string, string[]>
  timestamp: string
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error)

  let statusCode = 500
  let message = 'Internal server error'
  let code: string | undefined
  let errors: Record<string, string[]> | undefined

  if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
    
    if (error instanceof ValidationError) {
      errors = error.errors
    }
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Validation error'
    code = 'VALIDATION_ERROR'
    errors = error.issues.reduce((acc, issue) => {
      const path = issue.path.join('.')
      if (!acc[path]) acc[path] = []
      acc[path].push(issue.message)
      return acc
    }, {} as Record<string, string[]>)
  } else if (error instanceof Error) {
    message = error.message
  }

  return NextResponse.json(
    {
      error: message,
      code,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    status?: number
    headers?: Record<string, string>
  } = {}
) {
  const { status = 200, headers = {} } = options
  
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  options: {
    headers?: Record<string, string>
  } = {}
) {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  
  return createSuccessResponse(
    {
      data,
      pagination: {
        ...pagination,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    },
    options
  )
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  options: {
    status?: number
    code?: string
    headers?: Record<string, string>
  } = {}
) {
  const { status = 400, code, headers = {} } = options
  
  return NextResponse.json(
    {
      error: message,
      code,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  )
}

/**
 * Creates a standardized not found response
 */
export function createNotFoundResponse(message: string = 'Resource not found') {
  return createErrorResponse(message, { status: 404, code: 'NOT_FOUND' })
}
