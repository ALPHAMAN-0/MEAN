import { connectDb, disconnectDb } from '../config/db.js'
import { User } from '../models/user.model.js'
import { Task } from '../models/task.model.js'
import { RefreshToken } from '../models/refresh-token.model.js'
import { logger } from '../lib/logger.js'

/**
 * In production `autoIndex` is off (building an index on a live collection can lock
 * it), so index changes are applied deliberately — by running this.
 */
try {
  await connectDb()
  for (const model of [User, Task, RefreshToken]) {
    const dropped = await model.syncIndexes()
    logger.info({ model: model.modelName, dropped }, 'indexes synced')
  }
  await disconnectDb()
  process.exit(0)
} catch (err) {
  logger.error({ err }, 'index sync failed')
  process.exit(1)
}
