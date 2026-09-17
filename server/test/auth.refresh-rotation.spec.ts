import { describe, expect, it } from 'vitest'
import { api, bearer, refreshCookie, registerUser } from './helpers/api.js'

describe('refresh rotation', () => {
  it('exchanges the cookie for a new access token AND a different cookie', async () => {
    const { cookie } = await registerUser('rotate@example.com')

    const res = await api().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(200)

    expect(res.body.data.accessToken).toBeTypeOf('string')
    // Rotation, not reuse: the old cookie must not come back.
    expect(refreshCookie(res)).not.toBe(cookie)
  })

  it('issues a token that actually works', async () => {
    const { cookie } = await registerUser('rotate2@example.com')
    const res = await api().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(200)
    await api().get('/api/v1/auth/me').set(bearer(res.body.data.accessToken)).expect(200)
  })

  it('rejects a missing or unknown refresh cookie', async () => {
    await api().post('/api/v1/auth/refresh').expect(401)
    const res = await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refresh_token=completely-made-up')
      .expect(401)
    expect(res.body.error.code).toBe('REFRESH_TOKEN_INVALID')
  })

  it('logout revokes the family, so the cookie stops working', async () => {
    const { cookie } = await registerUser('logout@example.com')
    await api().post('/api/v1/auth/logout').set('Cookie', cookie).expect(204)
    await api().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(401)
  })
})
