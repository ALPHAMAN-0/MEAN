import type { Server } from 'node:http'
import { createApp } from './app.js'
import { connectDb, disconnectDb } from './config/db.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'

const app = createApp()

try {
  await connectDb()
} catch (err) {
  if (env.isProduction) {
    logger.fatal({ err }, 'could not reach MongoDB — refusing to start')
    process.exit(1)
  }
  // In development the API stays up so you get a readable /readyz and a usable
  // dev server, instead of the whole `npm run dev` session dying on a driver stack
  // trace because Docker was not running yet.
  logger.error({ err }, 'MongoDB is unreachable — run `make up`. /readyz will report not-ready.')
}

const server: Server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`)
  if (env.swaggerEnabled) logger.info(`API docs at http://127.0.0.1:${env.PORT}/api/v1/docs/`)
})

/**
 * Docker sends SIGTERM and waits 10s before SIGKILL. Honouring it means in-flight
 * requests finish instead of being cut off. (This only works because the container
 * runs `node dist/server.js` directly — with `npm start`, npm is PID 1 and swallows
 * the signal.)
 */
let shuttingDown = false
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  const force = setTimeout(() => {
    logger.error('graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, 10_000)
  force.unref()

  server.close()
  server.closeIdleConnections()
  await new Promise<void>((resolve) => server.once('close', () => resolve()))
  await disconnectDb()

  logger.info('shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
