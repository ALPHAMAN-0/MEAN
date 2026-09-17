import type { ApiErrorDetail, ErrorCode } from '@mean/shared'

/**
 * The only error type the API deliberately renders. Anything else reaching the
 * error handler becomes a 500 with its stack logged but never serialized.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static validation(message: string, details?: ApiErrorDetail[]): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, details)
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'You do not have access to this resource'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message)
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, 'CONFLICT', message)
  }

  static refreshInvalid(message = 'Refresh token is missing or invalid'): ApiError {
    return new ApiError(401, 'REFRESH_TOKEN_INVALID', message)
  }

  static refreshReused(
    message = 'Refresh token was already used — the session family has been revoked',
  ): ApiError {
    return new ApiError(401, 'REFRESH_TOKEN_REUSED', message)
  }
}
