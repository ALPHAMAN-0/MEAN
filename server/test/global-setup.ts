import { MongoMemoryReplSet } from 'mongodb-memory-server'
import type { TestProject } from 'vitest/node'

/**
 * ONE in-memory MongoDB for the whole run, started as a single-node REPLICA SET —
 * not a standalone — because refresh-token rotation uses a transaction, and
 * transactions require a replica set. This is the same reason docker-compose.yml
 * runs rs0.
 *
 * No Docker needed: mongodb-memory-server downloads a real mongod (pinned by
 * `config.mongodbMemoryServer.version` in package.json) into ~/.cache.
 */
let replset: MongoMemoryReplSet | undefined

export default async function setup(project: TestProject) {
  replset = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  })
  project.provide('mongoUri', replset.getUri())

  return async () => {
    await replset?.stop()
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    mongoUri: string
  }
}
