import type { RequestHandler } from 'express'
import type { Role } from '@mean/shared'
import { ApiError } from '../lib/api-error.js'
import { verifyAccessToken } from '../modules/auth/tokens.js'

/** Bearer access token -> req.auth. Any token problem is a 401, never a 403. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized())
    return
  }

  try {
    req.auth = await verifyAccessToken(header.slice('Bearer '.length))
    next()
  } catch {
    next(ApiError.unauthorized('Access token is invalid or expired'))
  }
}

/**
 * 403 is reserved for a VALID identity that lacks permission. Mixing this with 401
 * is the classic way to make a client's refresh logic loop forever.
 */
export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(ApiError.unauthorized())
      return
    }
    if (!roles.includes(req.auth.role)) {
      next(ApiError.forbidden())
      return
    }
    next()
  }
}
