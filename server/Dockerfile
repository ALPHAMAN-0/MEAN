# syntax=docker/dockerfile:1
#
# BUILD CONTEXT IS THE REPO ROOT, not server/:
#   docker build -f server/Dockerfile .
# npm workspaces put the lockfile, the root manifest and shared/ outside this
# directory, and `npm ci` needs all of them.

FROM node:22.23-bookworm-slim AS build
WORKDIR /app

# Manifests first: this layer is cached until a dependency actually changes.
# Every workspace manifest must be present or the lockfile cannot be reified.
COPY package.json package-lock.json .npmrc ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY shared/ shared/
COPY server/ server/
RUN npm run build -w @mean/shared && npm run build -w @mean/server

FROM node:22.23-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
# Only the API's production dependencies. --ignore-scripts is safe here because the
# compiled shared/dist is copied in below rather than built by its prepare hook.
RUN npm ci --omit=dev --workspace @mean/server --include-workspace-root --ignore-scripts

COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/dist server/dist

USER node
EXPOSE 3000
# node directly, never `npm start`: npm as PID 1 swallows SIGTERM and Docker's
# 10-second grace period turns into a hard kill mid-request.
CMD ["node", "server/dist/server.js"]
