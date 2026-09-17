#!/usr/bin/env bash
# One-shot replica-set initiator. Runs as its own compose service because
# docker-entrypoint-initdb.d scripts execute against a TEMPORARY standalone mongod
# that the image starts with --replSet stripped — rs.initiate() there is impossible.
set -euo pipefail

URI="mongodb://mongo:27017/?directConnection=true"
AUTH=(--username "${MONGO_ROOT_USERNAME}" --password "${MONGO_ROOT_PASSWORD}" --authenticationDatabase admin)

# During initdb, mongod binds 127.0.0.1 ONLY, so a connection from this container is
# REFUSED rather than slow. On a fresh volume that phase is the normal first-run case.
echo "[mongo-init] waiting for mongod to accept connections…"
for i in $(seq 1 60); do
  if mongosh "$URI" "${AUTH[@]}" --quiet --eval 'db.hello()' >/dev/null 2>&1; then
    echo "[mongo-init] reachable after ${i} attempt(s)"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "[mongo-init] FATAL: mongod never became reachable (120s)" >&2
    exit 1
  fi
  sleep 2
done

echo "[mongo-init] initiating replica set rs0…"
mongosh "$URI" "${AUTH[@]}" --quiet --eval '
  try {
    // The members array is NOT optional: with no argument, MongoDB stores the
    // container hostname, which Compose regenerates on every recreate — so the
    // set would never find a primary again after `make down && make up`.
    rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] })
    print("[mongo-init] rs.initiate() ok")
  } catch (e) {
    if (e.codeName === "AlreadyInitialized" || /already initialized/i.test(e.message)) {
      print("[mongo-init] replica set already initialized")
    } else {
      throw e
    }
  }'

echo "[mongo-init] waiting for a writable primary…"
mongosh "$URI" "${AUTH[@]}" --quiet --eval '
  for (let i = 0; i < 60; i++) {
    const h = db.hello()
    if (h.setName === "rs0" && h.isWritablePrimary) { print("[mongo-init] primary elected"); quit(0) }
    sleep(1000)
  }
  print("[mongo-init] FATAL: no primary after 60s")
  quit(1)'

echo "[mongo-init] ensuring least-privilege application user…"
mongosh "$URI" "${AUTH[@]}" --quiet --eval "
  const appDb = db.getSiblingDB('${MONGO_DB}')
  const user = '${MONGO_APP_USERNAME}'
  const roles = [{ role: 'readWrite', db: '${MONGO_DB}' }]
  if (appDb.getUser(user)) {
    appDb.updateUser(user, { pwd: '${MONGO_APP_PASSWORD}', roles })
    print('[mongo-init] app user updated')
  } else {
    appDb.createUser({ user, pwd: '${MONGO_APP_PASSWORD}', roles })
    print('[mongo-init] app user created')
  }"

echo "[mongo-init] complete"
