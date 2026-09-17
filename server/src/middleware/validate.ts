import type { Request, RequestHandler } from 'express'
import type { ZodType } from 'zod'
import type { ApiErrorDetail } from '@mean/shared'
import { ApiError } from '../lib/api-error.js'

interface Schemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

/**
 * Validates and COERCES request input into `req.valid`.
 *
 * It deliberately does not write back to req.query: in Express 5 that property is
 * getter-only and assigning to it throws. This is the single most common Express
 * 4 -> 5 migration break.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const details: ApiErrorDetail[] = []
    req.valid = {}

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key]
      if (!schema) continue

      const result = schema.safeParse(req[key])
      if (result.success) {
        req.valid[key] = result.data
      } else {
        for (const issue of result.error.issues) {
          details.push({
            path: [key, ...issue.path.map(String)].join('.'),
            message: issue.message,
          })
        }
      }
    }

    if (details.length > 0) {
      next(ApiError.validation('Request validation failed', details))
      return
    }
    next()
  }
}

export const validBody = <T>(req: Request): T => req.valid.body as T
export const validQuery = <T>(req: Request): T => req.valid.query as T
export const validParams = <T>(req: Request): T => req.valid.params as T
