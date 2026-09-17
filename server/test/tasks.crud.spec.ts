import { beforeEach, describe, expect, it } from 'vitest'
import { api, bearer, registerUser } from './helpers/api.js'

describe('tasks CRUD', () => {
  let token: string

  beforeEach(async () => {
    token = (await registerUser('tasks@example.com')).accessToken
  })

  it('creates, reads, updates and deletes', async () => {
    const created = await api()
      .post('/api/v1/tasks')
      .set(bearer(token))
      .send({ title: 'Write the README', description: 'A real quickstart' })
      .expect(201)

    expect(created.body.data).toMatchObject({ title: 'Write the README', status: 'todo' })
    const { id } = created.body.data

    await api().get(`/api/v1/tasks/${id}`).set(bearer(token)).expect(200)

    const patched = await api()
      .patch(`/api/v1/tasks/${id}`)
      .set(bearer(token))
      .send({ status: 'done' })
      .expect(200)
    expect(patched.body.data.status).toBe('done')

    await api().delete(`/api/v1/tasks/${id}`).set(bearer(token)).expect(204)
    await api().get(`/api/v1/tasks/${id}`).set(bearer(token)).expect(404)
  })

  it('paginates, filters and sorts, reporting meta alongside data', async () => {
    for (const title of ['alpha', 'bravo', 'charlie']) {
      await api().post('/api/v1/tasks').set(bearer(token)).send({ title }).expect(201)
    }
    await api()
      .post('/api/v1/tasks')
      .set(bearer(token))
      .send({ title: 'delta', status: 'done' })
      .expect(201)

    const page = await api().get('/api/v1/tasks?page=1&pageSize=2').set(bearer(token)).expect(200)
    expect(page.body.data).toHaveLength(2)
    expect(page.body.meta).toMatchObject({ page: 1, pageSize: 2, total: 4, totalPages: 2 })

    const done = await api().get('/api/v1/tasks?status=done').set(bearer(token)).expect(200)
    expect(done.body.data.map((t: { title: string }) => t.title)).toEqual(['delta'])

    const searched = await api().get('/api/v1/tasks?q=brav').set(bearer(token)).expect(200)
    expect(searched.body.data).toHaveLength(1)

    const sorted = await api().get('/api/v1/tasks?sort=title').set(bearer(token)).expect(200)
    expect(sorted.body.data.map((t: { title: string }) => t.title)).toEqual([
      'alpha',
      'bravo',
      'charlie',
      'delta',
    ])
  })

  it('treats a search string as text, not as a regular expression', async () => {
    await api().post('/api/v1/tasks').set(bearer(token)).send({ title: 'plain' }).expect(201)
    const res = await api().get('/api/v1/tasks?q=.%2A').set(bearer(token)).expect(200)
    expect(res.body.data).toHaveLength(0)
  })

  it('requires authentication for every task route', async () => {
    await api().get('/api/v1/tasks').expect(401)
    await api().post('/api/v1/tasks').send({ title: 'nope' }).expect(401)
  })
})
