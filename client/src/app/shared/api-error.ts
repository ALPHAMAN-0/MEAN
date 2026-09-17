import { HttpErrorResponse } from '@angular/common/http'
import type { ApiErrorBody } from '@mean/shared'

/**
 * Turns the server's `{ error: { code, message, details? } }` into one line a
 * human can act on. Because the envelope is a fixed contract, this is the only
 * place in the client that has to know its shape.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback

  const body = error.error as Partial<ApiErrorBody> | null
  const apiError = body?.error
  if (!apiError) return error.status === 0 ? 'Cannot reach the API — is it running?' : fallback

  if (apiError.details?.length) {
    return apiError.details.map((d) => d.message).join(' · ')
  }
  return apiError.message || fallback
}
