#!/usr/bin/env bash
# Brings up the fully containerized stack (nginx -> api -> mongo).
#
# This stack runs NODE_ENV=production, and the API refuses to start in production
# with the development placeholder secret — which is the correct behaviour, but it
# should not make `make full` fail on a fresh clone.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || cp .env.example .env

if grep -q '^JWT_ACCESS_SECRET=dev-only' .env; then
  JWT_ACCESS_SECRET="$(node --input-type=module -e "import {randomBytes} from 'node:crypto'; console.log(randomBytes(48).toString('base64url'))")"
  export JWT_ACCESS_SECRET
  cat <<'NOTE'

  .env still contains the development placeholder JWT_ACCESS_SECRET, and this
  stack runs NODE_ENV=production, where the API refuses it on purpose.
  Using an ephemeral secret for this run — existing sessions will not survive a
  restart. For a stable one: npm run gen:secret, then set it in .env.

NOTE
fi

docker compose -f docker-compose.full.yml up -d --build --wait
docker compose -f docker-compose.full.yml ps
