import { z } from 'zod'

export const RoleSchema = z.enum(['user', 'admin'])
export type Role = z.infer<typeof RoleSchema>

/**
 * 12 characters, no composition rules. Length beats "must contain a symbol"
 * (NIST SP 800-63B), and it keeps the validation message honest.
 */
export const PasswordSchema = z
  .string()
  .min(12, { error: 'Password must be at least 12 characters' })
  .max(200, { error: 'Password must be at most 200 characters' })

export const RegisterSchema = z.object({
  // Zod 4: top-level format helpers. z.string().email() is the deprecated spelling.
  email: z.email({ error: 'A valid email address is required' }).toLowerCase(),
  password: PasswordSchema,
  name: z.string().trim().min(1, { error: 'Name is required' }).max(80),
})
export type RegisterInput = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1, { error: 'Password is required' }),
})
export type LoginInput = z.infer<typeof LoginSchema>

/** What the API is willing to say about a user. Never includes passwordHash. */
export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: RoleSchema,
  createdAt: z.iso.datetime(),
})
export type PublicUser = z.infer<typeof PublicUserSchema>

export const AuthResultSchema = z.object({
  accessToken: z.string(),
  user: PublicUserSchema,
})
export type AuthResult = z.infer<typeof AuthResultSchema>

/**
 * The access-token payload. The server zod-parses this after verifying the
 * signature rather than trusting jose's unchecked generic.
 */
export const AccessClaimsSchema = z.object({
  sub: z.string(),
  email: z.email(),
  role: RoleSchema,
})
export type AccessClaims = z.infer<typeof AccessClaimsSchema>
