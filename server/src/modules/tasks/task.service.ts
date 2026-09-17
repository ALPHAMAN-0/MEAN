// Mongoose 9 renamed FilterQuery -> QueryFilter.
import type { QueryFilter, Types } from 'mongoose'
import {
  pageMeta,
  type CreateTaskInput,
  type ListTasksQuery,
  type PageMeta,
  type TaskDto,
  type UpdateTaskInput,
} from '@mean/shared'
import { Task, toTaskDto, type TaskAttrs } from '../../models/task.model.js'
import { ApiError } from '../../lib/api-error.js'

/** A user-supplied search string is not a regular expression. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sortSpec(sort: ListTasksQuery['sort']): Record<string, 1 | -1> {
  return sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 }
}

export async function listTasks(
  owner: Types.ObjectId,
  query: ListTasksQuery,
): Promise<{ tasks: TaskDto[]; meta: PageMeta }> {
  const filter: QueryFilter<TaskAttrs> = { owner }
  if (query.status) filter.status = query.status
  if (query.q) filter.title = { $regex: escapeRegex(query.q), $options: 'i' }

  const [docs, total] = await Promise.all([
    Task.find(filter)
      .sort(sortSpec(query.sort))
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize),
    Task.countDocuments(filter),
  ])

  return { tasks: docs.map(toTaskDto), meta: pageMeta(query.page, query.pageSize, total) }
}

/**
 * Every read and write is owner-scoped in the QUERY, not checked afterwards — and
 * someone else's task is a 404, not a 403, so the API never confirms that an id
 * you do not own exists.
 */
export async function getTask(owner: Types.ObjectId, id: string): Promise<TaskDto> {
  const doc = await Task.findOne({ _id: id, owner })
  if (!doc) throw ApiError.notFound('Task not found')
  return toTaskDto(doc)
}

export async function createTask(owner: Types.ObjectId, input: CreateTaskInput): Promise<TaskDto> {
  const doc = await Task.create({
    owner,
    title: input.title,
    status: input.status,
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.dueDate === undefined ? {} : { dueDate: new Date(input.dueDate) }),
  })
  return toTaskDto(doc)
}

export async function updateTask(
  owner: Types.ObjectId,
  id: string,
  input: UpdateTaskInput,
): Promise<TaskDto> {
  const doc = await Task.findOneAndUpdate(
    { _id: id, owner },
    {
      $set: {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.dueDate === undefined ? {} : { dueDate: new Date(input.dueDate) }),
      },
    },
    { returnDocument: 'after', runValidators: true },
  )
  if (!doc) throw ApiError.notFound('Task not found')
  return toTaskDto(doc)
}

export async function deleteTask(owner: Types.ObjectId, id: string): Promise<void> {
  const result = await Task.deleteOne({ _id: id, owner })
  if (result.deletedCount === 0) throw ApiError.notFound('Task not found')
}
