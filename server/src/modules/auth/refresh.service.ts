import mongoose, { type Types } from 'mongoose'
import { randomUUID } from 'node:crypto'
import { RefreshToken } from '../../models/refresh-token.model.js'
import { ApiError } from '../../lib/api-error.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { generateRefreshToken, hashRefreshToken } from './tokens.js'

export interface TokenContext {
  userAgent?: string | undefined
  ip?: string | undefined
}

function expiry(): Date {
  return new Date(Date.now() + env.refreshTokenTtlMs)
}

/** Issues the first token of a new family — i.e. a fresh login. */
export async function issueRefreshToken(user: Types.ObjectId, ctx: TokenContext): Promise<string> {
  const raw = generateRefreshToken()
  await RefreshToken.create({
    tokenHash: hashRefreshToken(raw),
    user,
    family: randomUUID(),
    expiresAt: expiry(),
    revokedAt: null,
    replacedBy: null,
    ...(ctx.userAgent ? { userAgent: ctx.userAgent } : {}),
    ...(ctx.ip ? { ip: ctx.ip } : {}),
  })
  return raw
}

export interface RotationResult {
  userId: Types.ObjectId
  token: string
}

/**
 * Rotate-on-use with reuse detection.
 *
 * If a token that has ALREADY been rotated is presented, the only sane conclusion is
 * that it was stolen (the legitimate client would be holding the successor), so the
 * entire family is revoked and everyone has to log in again.
 */
export async function rotateRefreshToken(raw: string, ctx: TokenContext): Promise<RotationResult> {
  const tokenHash = hashRefreshToken(raw)
  const existing = await RefreshToken.findOne({ tokenHash })

  if (!existing) throw ApiError.refreshInvalid()

  if (existing.revokedAt) {
    // CRITICAL: revoke OUTSIDE any transaction. Doing this inside withTransaction and
    // then throwing would roll the revocation back, turning reuse detection into a
    // no-op — see test/auth.reuse-detection.spec.ts.
    await RefreshToken.updateMany(
      { family: existing.family, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    )
    logger.warn(
      { family: existing.family, user: existing.user },
      'refresh token reuse detected — family revoked',
    )
    throw ApiError.refreshReused()
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw ApiError.refreshInvalid('Refresh token has expired')
  }

  const nextRaw = generateRefreshToken()
  const nextHash = hashRefreshToken(nextRaw)

  // The transaction is why this project runs a replica set: revoking the old token
  // and minting its successor must not be separable.
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const revoked = await RefreshToken.updateOne(
        { _id: existing._id, revokedAt: null },
        { $set: { revokedAt: new Date(), replacedBy: nextHash } },
        { session },
      )
      // Someone else rotated this token between our read and our write.
      if (revoked.modifiedCount !== 1) throw ApiError.refreshInvalid()

      await RefreshToken.create(
        [
          {
            tokenHash: nextHash,
            user: existing.user,
            family: existing.family,
            expiresAt: expiry(),
            revokedAt: null,
            replacedBy: null,
            ...(ctx.userAgent ? { userAgent: ctx.userAgent } : {}),
            ...(ctx.ip ? { ip: ctx.ip } : {}),
          },
        ],
        { session },
      )
    })
  } finally {
    await session.endSession()
  }

  return { userId: existing.user, token: nextRaw }
}

/** Logout: revoke the presented token and everything else in its family. */
export async function revokeRefreshToken(raw: string): Promise<void> {
  const existing = await RefreshToken.findOne({ tokenHash: hashRefreshToken(raw) })
  if (!existing) return
  await RefreshToken.updateMany(
    { family: existing.family, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )
}
