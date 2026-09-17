import type { AccessClaims } from '@mean/shared'

declare global {
  namespace Express {
    interface Request {
      /**
       * Validated, coerced input. It does NOT overwrite req.query, which is a
       * getter-only property in Express 5 — assigning to it throws at runtime.
       */
      valid: {
        body?: unknown
        query?: unknown
        params?: unknown
      }
      auth?: AccessClaims
      id: string
    }
  }
}

export {}
