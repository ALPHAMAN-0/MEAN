import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { AccessClaimsSchema, type AccessClaims } from '@mean/shared'
import { env } from '../../config/env.js'

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret, {
    // Pinned explicitly: without this, the token's own header chooses the algorithm.
    algorithms: ['HS256'],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  })
  // jose's payload generic is unchecked, so parse it rather than trust it.
  return AccessClaimsSchema.parse(payload)
}

/** 32 bytes of entropy — the refresh token itself is never stored. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
