import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'
import { ApiError } from '../lib/api-error.js'

/**
 * windowMs and limit are always explicit: v8's defaults are 5 requests per minute.
 * No custom keyGenerator either — the built-in one already normalizes IPv6, and
 * hand-rolling one on req.ip is what triggers ERR_ERL_KEY_GEN_IPV6.
 */
const shared = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (): never => {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many requests — try again shortly')
  },
} as const

export const globalLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
})

/**
 * Credential endpoints get a tighter bucket, and successful requests do not count —
 * this throttles guessing, not usage.
 */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
})
