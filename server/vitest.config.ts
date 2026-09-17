import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    // Forks, not threads: mongoose keeps module-level state that does not survive
    // being shared across worker threads.
    pool: 'forks',
    testTimeout: 20_000,
    hookTimeout: 60_000,
    /**
     * config/env.ts zod-validates at import time and app.ts imports it, so without
     * these the suite is red on every clean clone and in CI — after a ~100MB mongod
     * download. MONGO_URI is a placeholder; global-setup injects the real one.
     */
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      PORT: '0',
      MONGO_URI: 'mongodb://127.0.0.1:27017/placeholder',
      JWT_ACCESS_SECRET: 'test-only-secret-that-is-at-least-32-characters-long',
      JWT_ISSUER: 'mean-boilerplate-test',
      JWT_AUDIENCE: 'mean-client-test',
      ACCESS_TOKEN_TTL: '15m',
      REFRESH_TOKEN_TTL_DAYS: '7',
      // 2^14 instead of 2^17: a 250ms hash per login would make the suite crawl.
      PASSWORD_SCRYPT_COST: '14',
      TRUST_PROXY: '0',
      SWAGGER_ENABLED: 'false',
      CORS_ORIGINS: 'http://localhost:4200',
    },
  },
})
