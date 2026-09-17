import { describe, expect, it } from 'vitest'
import { api, bearer, registerUser } from './helpers/api.js'

describe('task ownership', () => {
  it("answers 404 — not 403 — for another user's task", async () => {
    const alice = await registerUser('alice@example.com')
    const bob = await registerUser('bob@example.com')

    const task = await api()
      .post('/api/v1/tasks')
      .set(bearer(alice.accessToken))
      .send({ title: "Alice's private task" })
      .expect(201)
    const { id } = task.body.data

    // 403 would confirm the id exists. 404 tells Bob nothing.
    await api().get(`/api/v1/tasks/${id}`).set(bearer(bob.accessToken)).expect(404)
    await api()
      .patch(`/api/v1/tasks/${id}`)
      .set(bearer(bob.accessToken))
      .send({ status: 'done' })
      .expect(404)
    await api().delete(`/api/v1/tasks/${id}`).set(bearer(bob.accessToken)).expect(404)

    // And Alice still has it.
    await api().get(`/api/v1/tasks/${id}`).set(bearer(alice.accessToken)).expect(200)
  })

  it('lists only your own tasks', async () => {
    const alice = await registerUser('alice2@example.com')
    const bob = await registerUser('bob2@example.com')

    await api()
      .post('/api/v1/tasks')
      .set(bearer(alice.accessToken))
      .send({ title: 'a' })
      .expect(201)
    await api().post('/api/v1/tasks').set(bearer(bob.accessToken)).send({ title: 'b' }).expect(201)

    const res = await api().get('/api/v1/tasks').set(bearer(bob.accessToken)).expect(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe('b')
  })
})
