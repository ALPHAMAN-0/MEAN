# syntax=docker/dockerfile:1
#
# BUILD CONTEXT IS THE REPO ROOT, not server/:
#   docker build -f server/Dockerfile .
# npm workspaces put the lockfile, the root manifest and shared/ outside this
# directory, and `npm ci` needs all of them.

FROM node:22.23-bookworm-slim AS build
WORKDIR /app

# Every workspace manifest must be present or the lockfile cannot be reified.
# shared/ is copied in FULL rather than manifest-only, because `npm ci` runs its
# `prepare` hook during install and that hook compiles its sources. (--ignore-scripts
# does not help: npm runs prepare for workspace link nodes regardless.)
COPY package.json package-lock.json .npmrc ./
COPY shared/ shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY server/ server/
RUN npm run build -w @mean/server

# Prune the node_modules we already have instead of reinstalling with --omit=dev.
# A second `npm ci --omit=dev` re-runs shared's `prepare` hook with no TypeScript
# compiler present and dies with exit 127 — and --ignore-scripts does NOT prevent
# it, because npm runs prepare for workspace link nodes regardless.
RUN npm prune --omit=dev

FROM node:22.23-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# node_modules/@mean/shared is a relative symlink into ../../shared, so shared's
# manifest and dist must come along for it to resolve.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist

USER node
EXPOSE 3000
# node directly, never `npm start`: npm as PID 1 swallows SIGTERM and Docker's
# 10-second grace period turns into a hard kill mid-request.
CMD ["node", "server/dist/server.js"]
