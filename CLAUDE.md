# CLAUDE.md

## Commands (run from the repo ROOT)

- install: `npm ci` — never run npm install inside `server/`, `client/` or `shared/`
- dev: `make dev` (or `npm run dev`) · database: `make up` / `make down` / `make reset`
- build: `npm run build` · typecheck: `npm run typecheck` · lint: `npm run lint`
- test: `npm test` (no Docker needed) · one workspace: `npm test -w @mean/server`
- format: `npm run format` / `npm run format:check`
- seed: `make seed` · smoke a running API: `make smoke`
- whole gate: `npm run verify`

## Rules

- Node must be >= 22.22.3 (`.nvmrc` = 22.23.2). Angular 22 refuses to run below it.
- TypeScript is pinned to 6.0.3 and Vitest to 4.1.11 — Angular 22 peers cap both.
  Do not bump them to `latest` (7.x / 5.x) without changing Angular.
- `@mean/shared` must be built before typecheck/test/build. Its `prepare` hook does
  this on install; scripts also prefix `npm run build:shared`.
- Express 5: never a bare `'*'` route path, never assign to `req.query`, never
  `res.send()` — ESLint enforces the last two.
- Host MongoDB URI needs `directConnection=true`; the container URI uses
  `replicaSet=rs0`. Use `127.0.0.1`, never `localhost`.
- Reuse detection must revoke the token family OUTSIDE the transaction
  (`server/src/modules/auth/refresh.service.ts`) or it silently rolls back.
- Client tests run through `ng test`, not a raw vitest config.

## Read first

- `README.md` — quickstart and the gotchas that cost an hour
- `ARCHITECTURE.md` — component map
- `docs/adding-a-resource.md` — the files a new resource touches
- `shared/src/index.ts` — the API contract both sides share

Architecture: see ARCHITECTURE.md — read before structural changes
