import { connectDb, disconnectDb } from '../config/db.js'
import { User } from '../models/user.model.js'
import { Task } from '../models/task.model.js'
import { RefreshToken } from '../models/refresh-token.model.js'
import { hashPassword } from '../modules/auth/password.js'
import { logger } from '../lib/logger.js'

const DEMO_EMAIL = process.env['SEED_EMAIL'] ?? 'demo@example.com'
const DEMO_PASSWORD = process.env['SEED_PASSWORD'] ?? 'Password123!'
const ADMIN_EMAIL = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env['SEED_ADMIN_PASSWORD'] ?? 'Password123!'

const SAMPLE_TASKS = [
  {
    title: 'Read the auth flow doc',
    status: 'done' as const,
    description: 'docs/auth-flow.md explains refresh rotation.',
  },
  {
    title: 'Add a resource of your own',
    status: 'doing' as const,
    description: 'Follow docs/adding-a-resource.md.',
  },
  { title: 'Rotate JWT_ACCESS_SECRET', status: 'todo' as const, description: 'npm run gen:secret' },
  { title: 'Delete these sample tasks', status: 'todo' as const },
  { title: 'Ship something', status: 'todo' as const },
]

/** Idempotent: safe to run against an existing database, as often as you like. */
async function seed(): Promise<void> {
  await connectDb()

  const [demo, admin] = await Promise.all([
    upsertUser(DEMO_EMAIL, DEMO_PASSWORD, 'Demo User', 'user'),
    upsertUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin User', 'admin'),
  ])

  // Only the demo user's tasks are managed by the seed; anything you create yourself
  // under another account survives.
  await Task.deleteMany({ owner: demo._id })
  await Task.insertMany(SAMPLE_TASKS.map((t) => ({ ...t, owner: demo._id })))
  await RefreshToken.deleteMany({ user: { $in: [demo._id, admin._id] } })

  logger.info(
    { users: 2, tasks: SAMPLE_TASKS.length },
    `seed complete — log in as ${DEMO_EMAIL} / ${DEMO_PASSWORD} (admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD})`,
  )
  await disconnectDb()
}

async function upsertUser(email: string, password: string, name: string, role: 'user' | 'admin') {
  const passwordHash = await hashPassword(password)
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { passwordHash, name, role } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
  return user
}

try {
  await seed()
  process.exit(0)
} catch (err) {
  logger.error({ err }, 'seed failed')
  process.exit(1)
}
