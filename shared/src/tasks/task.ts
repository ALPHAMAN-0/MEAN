import { z } from 'zod'
import { PaginationQuerySchema } from '../api/pagination.js'

export const TaskStatusSchema = z.enum(['todo', 'doing', 'done'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  dueDate: z.iso.datetime().optional(),
  owner: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type TaskDto = z.infer<typeof TaskDtoSchema>

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, { error: 'Title is required' }).max(200),
  description: z.string().trim().max(2000).optional(),
  status: TaskStatusSchema.default('todo'),
  dueDate: z.iso.datetime({ error: 'dueDate must be an ISO 8601 date-time' }).optional(),
})
/** What the SERVER receives after parsing: `status` has been filled in by its default. */
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
/** What a CLIENT sends: anything with a schema default is optional. z.input, not z.infer. */
export type CreateTaskRequest = z.input<typeof CreateTaskSchema>

/** PATCH semantics: every field optional, but at least one must be present. */
export const UpdateTaskSchema = CreateTaskSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { error: 'At least one field must be provided' },
)
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type UpdateTaskRequest = z.input<typeof UpdateTaskSchema>

export const TASK_SORT_FIELDS = [
  'createdAt',
  '-createdAt',
  'dueDate',
  '-dueDate',
  'title',
  '-title',
] as const

export const ListTasksQuerySchema = PaginationQuerySchema.extend({
  status: TaskStatusSchema.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(TASK_SORT_FIELDS).default('-createdAt'),
})
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>
