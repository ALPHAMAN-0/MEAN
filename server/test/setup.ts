import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, inject } from 'vitest'

// A database per test FILE, so files can run in parallel without seeing each
// other's documents.
const dbName = `test_${randomBytes(6).toString('hex')}`

beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName })
})

afterEach(async () => {
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})))
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
