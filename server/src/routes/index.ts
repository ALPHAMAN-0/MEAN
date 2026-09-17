import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes.js'
import { taskRouter } from '../modules/tasks/task.routes.js'
import { usersRouter } from '../modules/users/users.routes.js'

/** Everything under /api/v1. Adding a resource means one line here. */
export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/tasks', taskRouter)
apiRouter.use('/users', usersRouter)
