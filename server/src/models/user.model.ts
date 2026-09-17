import { Schema, model, type HydratedDocument, type Types } from 'mongoose'
import type { PublicUser, Role } from '@mean/shared'

export interface UserAttrs {
  email: string
  passwordHash: string
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserAttrs>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  },
  { timestamps: true },
)

export const User = model<UserAttrs>('User', userSchema)
export type UserDoc = HydratedDocument<UserAttrs>

/**
 * The ONLY way a user leaves this process. An explicit mapper beats a toJSON
 * transform: you can see at a glance that passwordHash is not in the output.
 */
export function toPublicUser(doc: UserDoc): PublicUser {
  return {
    id: (doc._id as Types.ObjectId).toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
  }
}
