import { z } from 'zod'
import { PageMetaSchema, type PageMeta } from './pagination.js'

/**
 * Every response in this API has one of exactly two shapes:
 *   success -> { data, meta? }
 *   failure -> { error: { code, message, details? } }
 * `code` is the stable, machine-readable half; `message` is for humans.
 */
export interface ApiSuccess<T> {
  data: T
  meta?: PageMeta
}

export interface ApiErrorDetail {
  path: string
  message: string
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode
    message: string
    details?: ApiErrorDetail[]
  }
}

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'REFRESH_TOKEN_INVALID',
  'REFRESH_TOKEN_REUSED',
  'INTERNAL',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
})

/** Builds a parser for `{ data, meta? }` around any payload schema — used by the client. */
export function apiSuccessSchema<T extends z.ZodType>(data: T) {
  return z.object({ data, meta: PageMetaSchema.optional() })
}
