import type { CookieOptions, Response } from 'express'
import { env } from '../config/env.js'

/**
 * ONE options object for setting and clearing. A cookie is only cleared when the
 * attributes match, so the two must never be written out separately.
 *
 * Path is scoped to the auth routes: the refresh token is not attached to ordinary
 * API calls, so nothing but /auth/* can leak it.
 *
 * SameSite=Lax is what makes this CSRF-safe: :4200 -> :3000 is cross-ORIGIN but
 * same-SITE (ports are not part of a site), so the cookie still flows in dev.
 */
const base: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
  path: env.REFRESH_COOKIE_PATH,
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(env.REFRESH_COOKIE_NAME, token, { ...base, maxAge: env.refreshTokenTtlMs })
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, base)
}
