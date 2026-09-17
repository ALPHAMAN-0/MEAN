import { describe, expect, it } from 'vitest'
import { User } from '../src/models/user.model.js'
import { api, bearer, registerUser } from './helpers/api.js'

describe('role-based access', () => {
  it('403s a normal user and serves an admin', async () => {
    const normal = await registerUser('normal@example.com')
    await api().get('/api/v1/users').set(bearer(normal.accessToken)).expect(403)

    // Promote, then log in again so the new role is in the token.
    await User.updateOne({ email: 'normal@example.com' }, { $set: { role: 'admin' } })
    const promoted = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'normal@example.com', password: 'Password123!' })
      .expect(200)

    const res = await api()
      .get('/api/v1/users')
      .set(bearer(promoted.body.data.accessToken))
      .expect(200)
    expect(res.body.data[0].role).toBe('admin')
    expect(res.body.meta.total).toBe(1)
  })

  it('401s an anonymous caller, rather than 403', async () => {
    await api().get('/api/v1/users').expect(401)
  })
})
