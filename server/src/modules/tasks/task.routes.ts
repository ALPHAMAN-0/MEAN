import { Router } from 'express'
import { z } from 'zod'
import { CreateTaskSchema, ListTasksQuerySchema, UpdateTaskSchema } from '@mean/shared'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { create, getOne, list, remove, update } from './task.controller.js'

const IdParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, { error: 'Not a valid id' }) })

export const taskRouter = Router()

// One guard for the whole resource — an endpoint added later cannot forget it.
taskRouter.use(authenticate)

taskRouter.get('/', validate({ query: ListTasksQuerySchema }), list)
taskRouter.post('/', validate({ body: CreateTaskSchema }), create)
taskRouter.get('/:id', validate({ params: IdParams }), getOne)
taskRouter.patch('/:id', validate({ params: IdParams, body: UpdateTaskSchema }), update)
taskRouter.delete('/:id', validate({ params: IdParams }), remove)
