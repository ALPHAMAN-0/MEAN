import express, { type Express } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { requestId } from './middleware/request-id.js'
import { globalLimiter } from './middleware/rate-limit.js'
import { notFound } from './middleware/not-found.js'
import { errorHandler } from './middleware/error-handler.js'
import { healthRouter } from './routes/health.js'
import { apiRouter } from './routes/index.js'
import { docsRouter } from './docs/docs.router.js'

/**
 * Builds the app WITHOUT listening and WITHOUT connecting to MongoDB.
 *
 * That separation is what lets the test suite do `request(createApp())` against the
 * real middleware stack, with a throwaway in-memory database, and no open socket.
 * server.ts owns the listening and the connecting.
 */
export function createApp(): Express {
  const app = express()

  // A hop COUNT (0 on the host, 1 behind nginx). `true` would let any client spoof
  // X-Forwarded-For and defeat rate limiting — express-rate-limit v8 refuses it.
  app.set('trust proxy', env.TRUST_PROXY)
  app.disable('x-powered-by')

  app.use(requestId)
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).id }))
  app.use(helmet())
  // An exact origin plus credentials: true. A wildcard origin is illegal with
  // credentials, and cors() also answers the preflight — never add app.options('*').
  app.use(cors({ origin: env.corsOrigins, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  // Before the limiter: container healthchecks must not consume the shared bucket.
  app.use(healthRouter)
  app.use(globalLimiter)

  if (env.swaggerEnabled) app.use('/api/v1/docs', docsRouter)
  app.use('/api/v1', apiRouter)

  // Pathless. In Express 5 a bare '*' path throws "Missing parameter name".
  app.use(notFound)
  app.use(errorHandler)

  return app
}
