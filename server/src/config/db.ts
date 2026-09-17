import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../lib/logger.js'

mongoose.set('strictQuery', true)

export async function connectDb(uri: string = env.MONGO_URI): Promise<void> {
  await mongoose.connect(uri, {
    // 5s, not the 30s default: when Docker is not running you want to know now.
    serverSelectionTimeoutMS: 5_000,
    // Index building is a development convenience. In production it is a migration
    // you run deliberately — see src/scripts/sync-indexes.ts.
    autoIndex: !env.isProduction,
  })
  logger.info({ db: mongoose.connection.name }, 'mongodb connected')
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect()
}

/** 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting */
export function dbReady(): boolean {
  return mongoose.connection.readyState === 1
}
