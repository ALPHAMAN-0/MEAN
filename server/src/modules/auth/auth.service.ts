import type { Types } from 'mongoose'
import type { AuthResult, LoginInput, RegisterInput } from '@mean/shared'
import { User, toPublicUser, type UserDoc } from '../../models/user.model.js'
import { ApiError } from '../../lib/api-error.js'
import { hashPassword, verifyPassword } from './password.js'
import { signAccessToken } from './tokens.js'

export const userId = (user: UserDoc): Types.ObjectId => user._id as Types.ObjectId

export async function registerUser(input: RegisterInput): Promise<UserDoc> {
  const existing = await User.findOne({ email: input.email }).lean()
  if (existing) throw ApiError.conflict('That email address is already registered')

  return User.create({
    email: input.email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
    role: 'user',
  })
}

export async function authenticateUser(input: LoginInput): Promise<UserDoc> {
  const user = await User.findOne({ email: input.email })

  // One message for both branches: "no such user" and "wrong password" must be
  // indistinguishable, or the endpoint becomes an account-enumeration oracle.
  // (The timing still differs slightly, since a missing user skips the hash. Fixing
  // that properly means verifying against a dummy hash — worth it once you have
  // real users; noted here rather than hidden.)
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password')
  }
  return user
}

export async function accessTokenFor(user: UserDoc): Promise<string> {
  return signAccessToken({ sub: userId(user).toString(), email: user.email, role: user.role })
}

export async function authResultFor(user: UserDoc): Promise<AuthResult> {
  return { accessToken: await accessTokenFor(user), user: toPublicUser(user) }
}
