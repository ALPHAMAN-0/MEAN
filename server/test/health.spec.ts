import { describe, expect, it } from 'vitest'
import { api } from './helpers/api.js'

describe('health probes', () => {
  it('reports liveness in the standard envelope', async () => {
    const res = await api().get('/healthz').expect(200)
    expect(res.body.data.status).toBe('ok')
  })

  it('reports readiness once mongo is connected', async () => {
    const res = await api().get('/readyz').expect(200)
    expect(res.body.data).toMatchObject({ status: 'ready', db: 'connected' })
  })

  it('sets a request id header for log correlation', async () => {
    const res = await api().get('/healthz').expect(200)
    expect(res.headers['x-request-id']).toBeTruthy()
  })
})
