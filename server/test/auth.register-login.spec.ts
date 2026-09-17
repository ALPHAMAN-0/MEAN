import { describe, expect, it } from 'vitest'
import { api, bearer, refreshCookie, registerUser } from './helpers/api.js'

describe('register and login', () => {
  it('registers, returns an access token, and sets an httpOnly scoped cookie', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'new@example.com', password: 'Password123!', name: 'New User' })
      .expect(201)

    expect(res.body.data.accessToken).toBeTypeOf('string')
    expect(res.body.data.user).toMatchObject({ email: 'new@example.com', role: 'user' })
    // The hash must never leave the process.
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')

    const raw = (res.headers['set-cookie'] as unknown as string[])[0] as string
    expect(raw).toContain('HttpOnly')
    expect(raw).toContain('SameSite=Lax')
    expect(raw).toContain('Path=/api/v1/auth')
  })

  it('rejects a duplicate email with 409 CONFLICT', async () => {
    await registerUser('dup@example.com')
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'Password123!', name: 'Again' })
      .expect(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('logs in with the right password and rejects the wrong one identically to an unknown user', async () => {
    await registerUser('login@example.com')

    const good = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'Password123!' })
      .expect(200)
    expect(refreshCookie(good)).toContain('refresh_token=')

    const wrongPassword = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPassword1!' })
      .expect(401)
    const unknownUser = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123!' })
      .expect(401)

    // Identical messages: the endpoint must not confirm which emails exist.
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message)
  })

  it('serves /me with a bearer token and 401s without one', async () => {
    const { accessToken, user } = await registerUser('me@example.com')

    const res = await api().get('/api/v1/auth/me').set(bearer(accessToken)).expect(200)
    expect(res.body.data.id).toBe(user.id)

    await api().get('/api/v1/auth/me').expect(401)
    await api().get('/api/v1/auth/me').set(bearer('not-a-token')).expect(401)
  })
})
