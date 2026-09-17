import { describe, expect, it } from 'vitest'
import { api, refreshCookie, registerUser } from './helpers/api.js'

/**
 * THE test that catches the subtle bug: if the family revocation is performed
 * inside `session.withTransaction()` and the handler then throws, the revocation
 * is rolled back and reuse detection silently becomes a no-op. The third
 * assertion here — that the stolen successor ALSO stops working — is what fails
 * when that mistake is made.
 */
describe('refresh token reuse detection', () => {
  it('revokes the entire family when an already-rotated token is replayed', async () => {
    const { cookie: original } = await registerUser('reuse@example.com')

    const rotated = await api().post('/api/v1/auth/refresh').set('Cookie', original).expect(200)
    const successor = refreshCookie(rotated)

    // Replaying the consumed token: the legitimate client holds the successor, so
    // whoever is presenting this one should not have it.
    const replay = await api().post('/api/v1/auth/refresh').set('Cookie', original).expect(401)
    expect(replay.body.error.code).toBe('REFRESH_TOKEN_REUSED')

    // ...and the successor is dead too, because the whole family was revoked. It
    // reports REUSED rather than INVALID: the token exists, it is simply revoked —
    // which is precisely what the legitimate client needs to be told after a breach.
    const afterBreach = await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', successor)
      .expect(401)
    expect(afterBreach.body.error.code).toBe('REFRESH_TOKEN_REUSED')
  })

  it('keeps separate logins independent', async () => {
    const first = await registerUser('two-sessions@example.com')
    const second = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'two-sessions@example.com', password: 'Password123!' })
      .expect(200)

    // Breach the first session's family.
    await api().post('/api/v1/auth/refresh').set('Cookie', first.cookie).expect(200)
    await api().post('/api/v1/auth/refresh').set('Cookie', first.cookie).expect(401)

    // The other device is a different family and must survive.
    await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie(second)).expect(200)
  })
})
