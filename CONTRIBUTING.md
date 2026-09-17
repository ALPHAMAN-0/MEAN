# Contributing

## Setup

```bash
nvm use && cp .env.example .env && npm ci && make up && make seed
```

Node must be ≥ 22.22.3 — `npm ci` refuses otherwise (`engine-strict`), because Angular 22 would fail later with a bare exit code.

## Before you push

```bash
npm run verify
```

Runs the toolchain check, lint, format check, typecheck, tests and both builds — the same gate as CI. A pre-commit hook formats and lints staged files; it does not run tests.

## Conventions

- Everything at the **root**: `npm ci`, `npm test`, `npm run build`. Never inside a workspace.
- Changes to the API contract start in `shared/` and must be exported from `shared/src/index.ts`.
- New endpoints need a spec and an entry in `server/src/docs/openapi.ts`.
- Commit messages: `type(scope): summary` — `feat(tasks): add due-date filter`.

## Where to look

| Question                      | File                               |
| ----------------------------- | ---------------------------------- |
| How do I add a resource?      | `docs/adding-a-resource.md`        |
| How does login actually work? | `docs/auth-flow.md`                |
| What talks to what?           | `ARCHITECTURE.md`                  |
| Why won't it start?           | `make doctor`, then README → Notes |
