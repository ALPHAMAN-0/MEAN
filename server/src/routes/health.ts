import { Router } from 'express'
import { dbReady } from '../config/db.js'
import { ok } from '../lib/respond.js'

/**
 * Mounted BEFORE the global rate limiter: a container healthcheck polling every
 * few seconds would otherwise eat the shared bucket and start 429ing real traffic.
 *
 * Two probes, because they answer different questions:
 *   /healthz — is the process alive?      (restart me if not)
 *   /readyz  — can it serve traffic?      (stop routing to me if not)
 */
export const healthRouter = Router()

healthRouter.get('/healthz', (_req, res) => {
  ok(res, { status: 'ok', uptime: Math.round(process.uptime()) })
})

healthRouter.get('/readyz', (_req, res) => {
  const ready = dbReady()
  res.status(ready ? 200 : 503).json({
    data: { status: ready ? 'ready' : 'not-ready', db: ready ? 'connected' : 'disconnected' },
  })
})
