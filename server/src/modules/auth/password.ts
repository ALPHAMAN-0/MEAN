import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { env } from '../../config/env.js'

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

const KEY_LENGTH = 64
const R = 8
const P = 1

/**
 * node:crypto scrypt. No native build step, no third-party reimplementation of a
 * crypto primitive, and OWASP-endorsed.
 *
 * The stored string is self-describing — `scrypt$N$r$p$salt$hash` — so raising the
 * cost later does not invalidate existing hashes: old ones still verify with their
 * own parameters.
 */
export async function hashPassword(
  password: string,
  cost = env.PASSWORD_SCRYPT_COST,
): Promise<string> {
  const N = 2 ** cost
  const salt = randomBytes(16)
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: maxmemFor(N, R),
  })
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, nRaw, rRaw, pRaw, saltRaw, keyRaw] = parts
  if (!nRaw || !rRaw || !pRaw || !saltRaw || !keyRaw) return false

  const N = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false

  const salt = Buffer.from(saltRaw, 'base64')
  const expected = Buffer.from(keyRaw, 'base64')
  const actual = await scrypt(password.normalize('NFKC'), salt, expected.length, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r),
  })

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/** scrypt needs ~128 * N * r bytes; the default 32MiB cap is far too small at N=2^17. */
function maxmemFor(N: number, r: number): number {
  return Math.max(32 * 1024 * 1024, 256 * N * r)
}
