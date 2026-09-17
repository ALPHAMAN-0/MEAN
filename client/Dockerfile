# syntax=docker/dockerfile:1
# BUILD CONTEXT IS THE REPO ROOT: docker build -f client/Dockerfile .

FROM node:22.23-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY shared/ shared/
COPY client/ client/
RUN npm run build -w @mean/shared && npm run build -w @mean/client

FROM nginx:1.29-alpine AS runtime
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
# The application builder emits dist/<project>/browser.
COPY --from=build /app/client/dist/client/browser /usr/share/nginx/html
EXPOSE 8080
