import { describe, expect, it } from 'vitest'
import { api, bearer, registerUser } from './helpers/api.js'

describe('the error contract', () => {
  it('reports validation failures with a path per issue', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short', name: '' })
      .expect(400)

    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    const paths = res.body.error.details.map((d: { path: string }) => d.path)
    expect(paths).toContain('body.email')
    expect(paths).toContain('body.password')
    expect(paths).toContain('body.name')
  })

  it('coerces query strings to the declared types', async () => {
    const { accessToken } = await registerUser('coerce@example.com')
    const res = await api()
      .get('/api/v1/tasks?page=2&pageSize=5')
      .set(bearer(accessToken))
      .expect(200)
    // "2" arrived as a string and came back as a number.
    expect(res.body.meta.page).toBe(2)
    expect(res.body.meta.pageSize).toBe(5)
  })

  it('rejects an out-of-range pageSize instead of silently clamping', async () => {
    const { accessToken } = await registerUser('range@example.com')
    await api().get('/api/v1/tasks?pageSize=9999').set(bearer(accessToken)).expect(400)
  })

  it('treats malformed JSON as bad input, not a server error', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send('{"email": broken')
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an oversized body with 413', async () => {
    await api()
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(200_000) }))
      .expect(413)
  })

  it('renders an unknown route as a 404 envelope from the pathless handler', async () => {
    const res = await api().get('/api/v1/nope').expect(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('treats a malformed id as bad input, not a server error', async () => {
    const { accessToken } = await registerUser('badid@example.com')
    const res = await api()
      .get('/api/v1/tasks/not-an-object-id')
      .set(bearer(accessToken))
      .expect(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
