# MEAN Stack Boilerplate

A production-shaped starting point for **M**ongoDB · **E**xpress · **A**ngular · **N**ode, in TypeScript end to end. MongoDB runs in Docker so nothing has to be installed locally; the API and the client run on your machine with hot reload.

It ships the parts every real app needs and most templates skip: JWT auth with **rotating refresh tokens and reuse detection**, a validated environment, a consistent response envelope, generated API docs, and tests that need no database of their own.

---

## Quickstart

**Prerequisites:** Node **≥ 22.22.3** (`.nvmrc` pins 22.23.2 — Angular 22 refuses anything older) and Docker Desktop.

```bash
nvm use                 # or: nvm install 22.23.2
cp .env.example .env
npm ci                  # installs all three workspaces; shared/ builds itself
make up                 # MongoDB (replica set + auth) + mongo-express, waits for a primary
make seed               # demo@example.com / Password123!   ·   admin@example.com / Password123!
make dev                # API on :3000, Angular on :4200
```

Open **http://localhost:4200** and sign in with the seeded account.

Stuck? `make doctor` checks your Node version, Docker, and every port this project uses.

| Service            | URL                                | Notes                                                     |
| ------------------ | ---------------------------------- | --------------------------------------------------------- |
| Angular dev server | http://localhost:4200              | proxies `/api` to the API, so the browser sees one origin |
| API                | http://127.0.0.1:3000              | `/healthz`, `/readyz`                                     |
| API docs           | http://127.0.0.1:3000/api/v1/docs/ | generated from the shared zod schemas                     |
| mongo-express      | http://localhost:8081              | browse the database (basic auth: `admin` / `devadmin`)    |
| MongoDB            | mongodb://127.0.0.1:27017          | replica set `rs0`, auth enabled                           |

---

## Commands

| Command                 | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `make up` / `make down` | start / stop the database (data survives `down`)                   |
| `make reset`            | destroy the volume, start clean, reseed                            |
| `make dev`              | API + client with hot reload                                       |
| `make seed`             | idempotent demo data                                               |
| `make smoke`            | curl the whole auth + tasks flow against a running API             |
| `make full`             | build and run **everything** in containers → http://localhost:8080 |
| `make verify`           | the full gate: toolchain, lint, format, typecheck, tests, builds   |
| `npm test`              | all tests — **no Docker required** (in-memory MongoDB)             |
| `npm run gen:secret`    | a real `JWT_ACCESS_SECRET`                                         |

---

## How it fits together

```
client/   Angular 22 — standalone, signals, zoneless        :4200
server/   Express 5 + Mongoose 9                            :3000
shared/   @mean/shared — zod schemas + inferred DTOs        (imported by both)
```

`shared/` is a third npm workspace, not a folder of loose types. Both apps import `@mean/shared` through an ordinary `node_modules` symlink, so one zod schema validates the request on the server _and_ types the form on the client. Rename a field there and both sides stop compiling — which is the entire point.

Two topologies ship, and they behave differently on purpose:

- **Dev** (`make dev`) — the Angular dev server proxies `/api` to the API. Same origin, so CORS never participates.
- **Containers** (`make full`) — nginx serves the built SPA and proxies `/api` to the API container. Also same origin.

See `ARCHITECTURE.md` for the component map, `docs/auth-flow.md` for how sessions work, and `docs/adding-a-resource.md` to add your own resource.

---

## Notes that will save you an hour

- **Install at the root only.** `npm ci` in `server/` or `client/` will not link `@mean/shared`.
- **`shared/` builds itself** via its `prepare` hook on install. If you ever see `Cannot find module '@mean/shared'`, run `npm run build:shared`.
- **Two Mongo URIs.** From your host: `127.0.0.1` + `directConnection=true` (the replica set advertises itself as `mongo:27017`, which only resolves inside Docker). From a container: `mongo:27017` + `replicaSet=rs0`. Both are in `.env.example`.
- **Never `localhost` for the API or the database** — Node resolves it to `::1` first, and the published port only binds IPv4.
- The access token lives in memory only; the refresh token is an httpOnly cookie scoped to `/api/v1/auth`. A page reload silently refreshes, which is why you stay signed in.
- Angular's Vitest-based `unit-test` builder is the v22 default but is still marked **experimental** upstream.

---

## Starting a new project from this template

1. Rename the scope: `grep -rl '@mean/' --include=*.json --include=*.ts . | xargs sed -i '' 's|@mean/|@yourapp/|g'`
2. `COMPOSE_PROJECT_NAME=yourapp` in `.env` (keeps Docker volumes separate from other projects)
3. `npm run gen:secret` → `JWT_ACCESS_SECRET` in `.env`
4. Replace `Task` with your own first resource — `docs/adding-a-resource.md` lists every file
5. Replace `LICENSE`, then `rm -rf .git && git init`

## License

MIT — see `LICENSE`.
