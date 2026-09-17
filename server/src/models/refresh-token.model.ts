import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface RefreshTokenAttrs {
  /** sha256 of the raw token. Deterministic ON PURPOSE — a salted hash could not
   *  be looked up by unique index, and the token is 32 random bytes, so there is
   *  no dictionary to attack. */
  tokenHash: string
  user: Types.ObjectId
  /** All tokens descended from one login. Reuse revokes the whole family. */
  family: string
  expiresAt: Date
  revokedAt: Date | null
  replacedBy: string | null
  userAgent?: string
  ip?: string
  createdAt: Date
  updatedAt: Date
}

const refreshTokenSchema = new Schema<RefreshTokenAttrs>(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true },
)

// Mongo deletes expired rows on its own — no cleanup job to forget about.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken = model<RefreshTokenAttrs>('RefreshToken', refreshTokenSchema)
export type RefreshTokenDoc = HydratedDocument<RefreshTokenAttrs>
