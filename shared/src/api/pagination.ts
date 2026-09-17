import { z } from 'zod'

/** Pagination is reported in `meta`, never mixed into `data`. */
export const PageMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})

export type PageMeta = z.infer<typeof PageMetaSchema>

export const PaginationQuerySchema = z.object({
  // z.coerce, because everything arriving in a query string is a string.
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export function pageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
