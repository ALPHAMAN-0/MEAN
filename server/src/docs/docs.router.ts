import { Router } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { openApiDocument } from './openapi.js'

export const docsRouter = Router()

/**
 * swagger-ui-express injects an inline bootstrap script, which helmet's default
 * `script-src 'self'` blocks — the page renders blank with only a console error.
 * Relaxed HERE ONLY, so the rest of the API keeps the strict policy.
 */
docsRouter.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
      },
    },
  }),
)

docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument)
})

docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, { customSiteTitle: 'MEAN boilerplate API' }),
)
