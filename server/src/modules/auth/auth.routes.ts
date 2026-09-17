import { Router } from 'express'
import { LoginSchema, RegisterSchema } from '@mean/shared'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authLimiter } from '../../middleware/rate-limit.js'
import { login, logout, me, refresh, register } from './auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', authLimiter, validate({ body: RegisterSchema }), register)
authRouter.post('/login', authLimiter, validate({ body: LoginSchema }), login)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
