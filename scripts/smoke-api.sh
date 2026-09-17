#!/usr/bin/env bash
# A happy-path smoke test against a RUNNING api: register -> me -> create -> list
# -> refresh (rotating the cookie) -> logout.
#
# Deliberately thin. The interesting edge cases — rotation, reuse detection,
# ownership, validation — are covered by server/test/*.spec.ts, which can express
# them far better than curl and jq can.
set -euo pipefail

BASE="${SMOKE_BASE:-http://127.0.0.1:3000}/api/v1"
JAR="$(mktemp)"
BODY="$(mktemp)"
EMAIL="smoke-$$@example.com"
trap 'rm -f "$JAR" "$BODY"' EXIT

json() { node -e "const b=require('node:fs').readFileSync('$BODY','utf8');const j=JSON.parse(b);console.log($1)"; }

call() {
  curl -sS -o "$BODY" -w '%{http_code}' -b "$JAR" -c "$JAR" -H 'content-type: application/json' "$@"
}

check() {
  if [ "$1" != "$2" ]; then
    printf '  FAIL  %s — expected HTTP %s, got %s\n' "$3" "$2" "$1" >&2
    cat "$BODY" >&2
    exit 1
  fi
  printf '  ok    %s\n' "$3"
}

printf '\n  smoke test against %s\n\n' "$BASE"

# printf, not an inline literal: an unquoted {"a":1,"b":2} is BRACE EXPANSION in
# bash and silently becomes three separate arguments.
REGISTER_BODY="$(printf '{"email":"%s","password":"Password123!","name":"Smoke"}' "$EMAIL")"
check "$(call -X POST "$BASE/auth/register" -d "$REGISTER_BODY")" 201 'register'
TOKEN="$(json 'j.data.accessToken')"

check "$(call "$BASE/auth/me" -H "Authorization: Bearer $TOKEN")" 200 'authenticated /me'
check "$(call -X POST "$BASE/tasks" -H "Authorization: Bearer $TOKEN" -d "$(printf '{"title":"Smoke task"}')")" 201 'create a task'
check "$(call "$BASE/tasks" -H "Authorization: Bearer $TOKEN")" 200 'list tasks'
check "$(call -X POST "$BASE/auth/refresh")" 200 'refresh rotates the cookie'
check "$(call -X POST "$BASE/auth/logout")" 204 'logout'
check "$(call -X POST "$BASE/auth/refresh")" 401 'refresh is dead after logout'

printf '\n  all good\n\n'
