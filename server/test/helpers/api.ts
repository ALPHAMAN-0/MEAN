import request from 'supertest'
import type { Response } from 'supertest'
import type { AuthResult } from '@mean/shared'
import { createApp } from '../../src/app.js'

/** A fresh app per spec file: rate-limiter state never bleeds between files. */
export const app = createApp()
export const api = () => request(app)

export const REFRESH_COOKIE = 'refresh_token'

/** The raw `name=value` pair, so a test can replay an OLD cookie deliberately. */
export function refreshCookie(res: Response): string {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined
  const cookie = header?.find((c) => c.startsWith(`${REFRESH_COOKIE}=`))
  if (!cookie) throw new Error('response carried no refresh cookie')
  return cookie.split(';')[0] as string
}

export interface RegisteredUser {
  accessToken: string
  cookie: string
  user: AuthResult['user']
}

export async function registerUser(
  email = 'demo@example.com',
  password = 'Password123!',
  name = 'Demo User',
): Promise<RegisteredUser> {
  const res = await api().post('/api/v1/auth/register').send({ email, password, name }).expect(201)
  return {
    accessToken: res.body.data.accessToken,
    cookie: refreshCookie(res),
    user: res.body.data.user,
  }
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })
