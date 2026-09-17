#!/usr/bin/env node
/**
 * Fails fast, and readably, on the two version constraints this repo cannot bend:
 *   - Node >= 22.22.3  (Angular 22 refuses to run below it — ng exits with a bare 3)
 *   - TypeScript 6.x   (@angular/compiler-cli@22 peers ">=6.0 <6.1"; npm's "latest" is 7.x)
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const problems = []

const MIN_NODE = [22, 22, 3]
const node = process.versions.node.split('.').map(Number)
const nodeOk =
  node[0] > MIN_NODE[0] ||
  (node[0] === MIN_NODE[0] &&
    (node[1] > MIN_NODE[1] || (node[1] === MIN_NODE[1] && node[2] >= MIN_NODE[2])))

if (!nodeOk) {
  problems.push(
    `Node ${process.versions.node} is too old. Angular 22 requires ^22.22.3 || ^24.15.0 || >=26.\n` +
      `    Fix:  nvm install 22.23.2 && nvm use 22.23.2      (this repo's .nvmrc)`,
  )
}

try {
  const ts = require('typescript/package.json').version
  if (!ts.startsWith('6.')) {
    problems.push(
      `TypeScript ${ts} is installed, but Angular 22 peers ">=6.0 <6.1".\n` +
        `    Fix:  npm i -D -E typescript@6.0.3`,
    )
  }
} catch {
  // Pre-install: nothing to check yet.
}

try {
  const vitest = require('vitest/package.json').version
  if (!vitest.startsWith('4.')) {
    problems.push(
      `Vitest ${vitest} is installed, but @angular/build@22 peers "^4.0.8".\n` +
        `    Fix:  npm i -D -E vitest@4.1.11`,
    )
  }
} catch {
  // Pre-install: nothing to check yet.
}

if (problems.length > 0) {
  console.error('\n  Toolchain check failed:\n')
  for (const p of problems) console.error(`  - ${p}\n`)
  process.exit(1)
}

console.log(`toolchain ok — node ${process.versions.node}`)
