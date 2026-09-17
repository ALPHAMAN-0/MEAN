import { Router } from 'express'
import type { RequestHandler } from 'express'
import { PaginationQuerySchema, pageMeta, type PaginationQuery } from '@mean/shared'
import { User, toPublicUser } from '../../models/user.model.js'
import { authenticate, authorize } from '../../middleware/authenticate.js'
import { validate, validQuery } from '../../middleware/validate.js'
import { ok } from '../../lib/respond.js'

/** The one endpoint that demonstrates role-based access: admins only. */
const list: RequestHandler = async (req, res) => {
  const { page, pageSize } = validQuery<PaginationQuery>(req)
  const [docs, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(),
  ])
  ok(res, docs.map(toPublicUser), pageMeta(page, pageSize, total))
}

export const usersRouter = Router()
usersRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  validate({ query: PaginationQuerySchema }),
  list,
)
