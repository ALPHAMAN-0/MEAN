import type { RequestHandler } from 'express'
import { ApiError } from '../lib/api-error.js'

/**
 * Mounted PATHLESS, with app.use(notFound).
 *
 * Express 5 uses path-to-regexp v8, where a bare '*' is no longer a valid path —
 * app.use('*', h) throws "Missing parameter name". A named wildcard '/{*splat}'
 * would work; needing no path at all is simpler.
 */
export const notFound: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`))
}
