import type { ErrorRequestHandler } from 'express'
import { MongoServerError } from 'mongodb'
import { Error as MongooseError } from 'mongoose'
import { ApiError } from '../lib/api-error.js'
import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'

/**
 * The single terminal error renderer. Four arguments, or Express treats it as
 * ordinary middleware and never calls it.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    })
    return
  }

  // A unique-index violation is a conflict, not a server fault.
  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'That value is already taken' },
    })
    return
  }

  // A malformed ObjectId in the URL is bad input, not a crash.
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed identifier',
        details: [{ path: err.path, message: `${String(err.value)} is not a valid id` }],
      },
    })
    return
  }

  logger.error(
    { err, requestId: req.id, method: req.method, url: req.originalUrl },
    'unhandled error',
  )

  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Internal server error',
      // A stack trace is a gift to an attacker. Developers get it in the log either way.
      ...(env.isProduction
        ? {}
        : { details: [{ path: '', message: err instanceof Error ? err.message : String(err) }] }),
    },
  })
}
