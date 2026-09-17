#!/usr/bin/env node
/** Answers "why won't it start?" in one command. */
import { execFileSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { existsSync } from 'node:fs'

const PORTS = [
  [3000, 'API'],
  [4200, 'Angular dev server'],
  [8080, 'nginx (full stack)'],
  [8081, 'mongo-express'],
  [27017, 'MongoDB'],
]

const portFree = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' })
    socket.on('connect', () => (socket.destroy(), resolve(false)))
    socket.on('error', () => resolve(true))
    setTimeout(() => (socket.destroy(), resolve(true)), 500)
  })

console.log(
  `node        ${process.versions.node}${process.versions.node.startsWith('22.18') ? '  <-- too old for Angular 22' : ''}`,
)
console.log(`.env        ${existsSync('.env') ? 'present' : 'MISSING — run: cp .env.example .env'}`)

try {
  execFileSync('docker', ['info'], { stdio: 'ignore' })
  console.log('docker      running')
} catch {
  console.log('docker      NOT running — start Docker Desktop, then `make up`')
}

for (const [port, what] of PORTS) {
  const free = await portFree(port)
  console.log(
    `port ${String(port).padEnd(6)} ${free ? 'free' : `IN USE  (${what} will fail to bind)`}`,
  )
}
