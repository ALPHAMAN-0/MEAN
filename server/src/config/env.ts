import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

/**
 * Loaded and validated ONCE, at import time, so a misconfigured process dies at
 * startup with a readable report instead of at 3am with `undefined is not a string`.
 *
 * Under test the environment comes from vitest.config.ts `test.env` — never from a
 * developer's local .env, or the suite would pass locally and fail in CI.
 */
if (process.env['NODE_ENV'] !== 'test') {
  for (const candidate of ['.env', '../.env']) {
    const path = resolve(process.cwd(), candidate)
    if (existsSync(path)) {
      process.loadEnvFile(path)
      break
    }
  }
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // A hop COUNT. express-rate-limit v8 rejects `true` as unsafe.
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),

  CLIENT_PORT: z.coerce.number().int().min(1).max(65535).default(4200),
  CORS_ORIGINS: z.string().optional(),

  MONGO_URI: z.string().min(1, { error: 'MONGO_URI is required (see .env.example)' }),

  JWT_ACCESS_SECRET: z.string().min(32, {
    error: 'JWT_ACCESS_SECRET must be at least 32 characters — run `npm run gen:secret`',
  }),
  JWT_ISSUER: z.string().default('mean-boilerplate'),
  JWT_AUDIENCE: z.string().default('mean-client'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(7),
  REFRESH_COOKIE_NAME: z.string().default('refresh_token'),
  REFRESH_COOKIE_PATH: z.string().startsWith('/').default('/api/v1/auth'),
  PASSWORD_SCRYPT_COST: z.coerce.number().int().min(12).max(20).default(17),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),

  SWAGGER_ENABLED: z.enum(['true', 'false']).default('true'),

  // Defaults to true in production. Set it explicitly when production-mode traffic
  // is served over plain HTTP — a Secure cookie is simply dropped there, and the
  // symptom (you are logged out on every reload) looks nothing like the cause.
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
  console.error(
    `\n  Invalid environment:\n${lines.join('\n')}\n\n  Fix .env (start from .env.example).\n`,
  )
  process.exit(1)
}

const raw = parsed.data

if (raw.NODE_ENV === 'production' && raw.JWT_ACCESS_SECRET.startsWith('dev-only')) {
  console.error(
    '\n  Refusing to start: JWT_ACCESS_SECRET is still the development placeholder.\n  Run `npm run gen:secret`.\n',
  )
  process.exit(1)
}

export const env = Object.freeze({
  ...raw,
  swaggerEnabled: raw.SWAGGER_ENABLED === 'true',
  cookieSecure: raw.COOKIE_SECURE ? raw.COOKIE_SECURE === 'true' : raw.NODE_ENV === 'production',
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  // One place decides the allowlist, derived from CLIENT_PORT unless overridden.
  corsOrigins: (raw.CORS_ORIGINS ?? `http://localhost:${raw.CLIENT_PORT}`)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  refreshTokenTtlMs: raw.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
})

export type Env = typeof env
