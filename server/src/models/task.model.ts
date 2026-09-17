import { Schema, model, type HydratedDocument, type Types } from 'mongoose'
import type { TaskDto, TaskStatus } from '@mean/shared'

export interface TaskAttrs {
  title: string
  description?: string
  status: TaskStatus
  dueDate?: Date
  owner: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<TaskAttrs>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo', required: true },
    dueDate: { type: Date },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

// Every list query is owner-scoped and sorted, so the index is compound and ordered
// to match: equality field first, then the sort key.
taskSchema.index({ owner: 1, createdAt: -1 })
taskSchema.index({ owner: 1, status: 1, createdAt: -1 })
taskSchema.index({ owner: 1, dueDate: 1 })

export const Task = model<TaskAttrs>('Task', taskSchema)
export type TaskDoc = HydratedDocument<TaskAttrs>

export function toTaskDto(doc: TaskDoc): TaskDto {
  return {
    id: (doc._id as Types.ObjectId).toString(),
    title: doc.title,
    ...(doc.description === undefined ? {} : { description: doc.description }),
    status: doc.status,
    ...(doc.dueDate === undefined ? {} : { dueDate: doc.dueDate.toISOString() }),
    owner: doc.owner.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
