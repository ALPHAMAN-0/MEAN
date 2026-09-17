/**
 * @types/swagger-ui-express is still 4.1.8 against the 5.0.1 runtime, so the
 * published types are wrong. Five honest lines beat a stale dependency.
 */
declare module 'swagger-ui-express' {
  import type { RequestHandler } from 'express'
  export const serve: RequestHandler[]
  export function setup(spec: unknown, options?: Record<string, unknown>): RequestHandler
}
