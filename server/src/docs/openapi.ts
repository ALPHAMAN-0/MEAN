import { z } from 'zod'
import { createDocument } from 'zod-openapi'
import {
  ApiErrorSchema,
  AuthResultSchema,
  CreateTaskSchema,
  ListTasksQuerySchema,
  LoginSchema,
  PageMetaSchema,
  PublicUserSchema,
  RegisterSchema,
  TaskDtoSchema,
  UpdateTaskSchema,
} from '@mean/shared'

/** The spec is GENERATED from the same zod schemas that validate requests, so it
 *  cannot drift from the implementation the way a hand-written one does. */
const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ApiErrorSchema } },
})

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { 'application/json': { schema } },
})

const bearer = [{ bearerAuth: [] }]

export const openApiDocument = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'MEAN boilerplate API',
    version: '1.0.0',
    description:
      'Every response is `{ data, meta? }` or `{ error: { code, message, details? } }`.\n\n' +
      'The refresh token lives in an httpOnly cookie scoped to `/api/v1/auth` and rotates on every use.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Create an account and start a session',
        requestBody: { content: { 'application/json': { schema: RegisterSchema } } },
        responses: {
          '201': json(z.object({ data: AuthResultSchema }), 'Registered; sets the refresh cookie'),
          '400': errorResponse('Validation failed'),
          '409': errorResponse('Email already registered'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Exchange credentials for an access token',
        requestBody: { content: { 'application/json': { schema: LoginSchema } } },
        responses: {
          '200': json(z.object({ data: AuthResultSchema }), 'Signed in; sets the refresh cookie'),
          '401': errorResponse('Invalid email or password'),
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['auth'],
        summary: 'Rotate the refresh cookie and mint a new access token',
        description:
          'Authenticated by the cookie alone. Presenting an already-rotated token revokes the whole family.',
        responses: {
          '200': json(z.object({ data: AuthResultSchema }), 'Rotated'),
          '401': errorResponse('Missing, invalid, expired or REUSED refresh token'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['auth'],
        summary: 'Revoke the session family and clear the cookie',
        responses: { '204': { description: 'Logged out' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'The signed-in user',
        security: bearer,
        responses: {
          '200': json(z.object({ data: PublicUserSchema }), 'Current user'),
          '401': errorResponse('Missing or expired access token'),
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['tasks'],
        summary: 'List your tasks',
        security: bearer,
        requestParams: { query: ListTasksQuerySchema },
        responses: {
          '200': json(
            z.object({ data: z.array(TaskDtoSchema), meta: PageMetaSchema }),
            'A page of tasks you own',
          ),
          '401': errorResponse('Unauthenticated'),
        },
      },
      post: {
        tags: ['tasks'],
        summary: 'Create a task',
        security: bearer,
        requestBody: { content: { 'application/json': { schema: CreateTaskSchema } } },
        responses: {
          '201': json(z.object({ data: TaskDtoSchema }), 'Created'),
          '400': errorResponse('Validation failed'),
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['tasks'],
        summary: 'Fetch one task you own',
        security: bearer,
        requestParams: { path: z.object({ id: z.string() }) },
        responses: {
          '200': json(z.object({ data: TaskDtoSchema }), 'The task'),
          '404': errorResponse('Not found — also returned for a task owned by someone else'),
        },
      },
      patch: {
        tags: ['tasks'],
        summary: 'Update a task you own',
        security: bearer,
        requestParams: { path: z.object({ id: z.string() }) },
        requestBody: { content: { 'application/json': { schema: UpdateTaskSchema } } },
        responses: {
          '200': json(z.object({ data: TaskDtoSchema }), 'Updated'),
          '404': errorResponse('Not found'),
        },
      },
      delete: {
        tags: ['tasks'],
        summary: 'Delete a task you own',
        security: bearer,
        requestParams: { path: z.object({ id: z.string() }) },
        responses: { '204': { description: 'Deleted' }, '404': errorResponse('Not found') },
      },
    },
    '/users': {
      get: {
        tags: ['users'],
        summary: 'List all users (admin only)',
        security: bearer,
        responses: {
          '200': json(
            z.object({ data: z.array(PublicUserSchema), meta: PageMetaSchema }),
            'A page of users',
          ),
          '403': errorResponse('Valid token, insufficient role'),
        },
      },
    },
  },
})
