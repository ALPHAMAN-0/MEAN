import type { Response } from 'express'
import type { PageMeta } from '@mean/shared'

/**
 * Every success response goes through here, so the `{ data, meta? }` envelope
 * cannot drift. (ESLint bans res.send() in this workspace: in Express 5,
 * res.send(200) sends the BODY 200 rather than setting the status.)
 */
export function ok<T>(res: Response, data: T, meta?: PageMeta): Response {
  return res.status(200).json(meta ? { data, meta } : { data })
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ data })
}

export function noContent(res: Response): Response {
  return res.status(204).end()
}
