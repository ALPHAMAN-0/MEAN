#!/usr/bin/env node
/**
 * `npm run dev` on a fresh clone used to die inside the zod env report because
 * nobody had copied .env.example yet. Now it just works.
 */
import { copyFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env')
  console.log('created .env from .env.example')
}

try {
  execFileSync('docker', ['info'], { stdio: 'ignore' })
} catch {
  console.warn(
    '\n  Docker does not appear to be running, so the API will start without a database.\n' +
      '  Start Docker Desktop, then:  make up\n',
  )
}
