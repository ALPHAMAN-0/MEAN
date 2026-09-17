import type { Request, RequestHandler } from 'express'
import type { LoginInput, RegisterInput } from '@mean/shared'
import { User, toPublicUser } from '../../models/user.model.js'
import { ApiError } from '../../lib/api-error.js'
import { created, noContent, ok } from '../../lib/respond.js'
import { clearRefreshCookie, setRefreshCookie } from '../../lib/cookies.js'
import { validBody } from '../../middleware/validate.js'
import { env } from '../../config/env.js'
import { authResultFor, authenticateUser, registerUser, userId } from './auth.service.js'
import { issueRefreshToken, revokeRefreshToken, rotateRefreshToken } from './refresh.service.js'

const contextOf = (req: Request) => ({
  userAgent: req.get('user-agent'),
  ip: req.ip,
})

export const register: RequestHandler = async (req, res) => {
  const user = await registerUser(validBody<RegisterInput>(req))
  setRefreshCookie(res, await issueRefreshToken(userId(user), contextOf(req)))
  created(res, await authResultFor(user))
}

export const login: RequestHandler = async (req, res) => {
  const user = await authenticateUser(validBody<LoginInput>(req))
  setRefreshCookie(res, await issueRefreshToken(userId(user), contextOf(req)))
  ok(res, await authResultFor(user))
}

/**
 * Authenticated by the cookie ALONE — deliberately no bearer token, because the
 * whole point is to be callable once the access token has expired.
 */
export const refresh: RequestHandler = async (req, res) => {
  const presented = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined
  if (!presented) throw ApiError.refreshInvalid()

  const rotated = await rotateRefreshToken(presented, contextOf(req))
  const user = await User.findById(rotated.userId)
  if (!user) throw ApiError.refreshInvalid()

  setRefreshCookie(res, rotated.token)
  ok(res, await authResultFor(user))
}

export const logout: RequestHandler = async (req, res) => {
  const presented = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined
  if (presented) await revokeRefreshToken(presented)
  clearRefreshCookie(res)
  noContent(res)
}

export const me: RequestHandler = async (req, res) => {
  const user = await User.findById(req.auth?.sub)
  if (!user) throw ApiError.unauthorized()
  ok(res, toPublicUser(user))
}
