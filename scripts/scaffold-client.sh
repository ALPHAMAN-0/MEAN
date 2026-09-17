#!/usr/bin/env bash
# Scaffolds client/ with Angular 22. Every flag here is load-bearing:
#
#   --ai-config=none   suppresses the v22 "Which AI tools should Angular integrate
#                      with?" prompt (it lives on the ai-config sub-schematic and
#                      fires whenever the flag is omitted)
#   NG_CLI_ANALYTICS   suppresses the analytics prompt, which --no-interactive
#                      provably does NOT (the CLI source carries a TODO saying so)
#   --style/--ssr      suppress the two application-schematic prompts
#   --skip-git         this repo already is a git repo
#   --skip-install     the single root `npm install` handles all three workspaces
#
# Requires Node >= 22.22.3; the global CLI may be older, hence npx with a pin.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d client ]; then
  echo "client/ already exists — refusing to overwrite. Remove it first." >&2
  exit 1
fi

NG_CLI_ANALYTICS=false npx -y @angular/cli@22 new client \
  --directory=client \
  --style=scss \
  --ssr=false \
  --routing \
  --zoneless \
  --test-runner=vitest \
  --ai-config=none \
  --package-manager=npm \
  --skip-git \
  --skip-install \
  --no-interactive

# Debris: ng new writes its own tooling config, which would compete with the
# repo-level config this workspace already has.
rm -rf client/.git client/.vscode client/.editorconfig client/.prettierrc client/.prettierrc.json client/.gitignore
node -e '
  const fs = require("node:fs")
  const p = "client/package.json"
  const pkg = JSON.parse(fs.readFileSync(p, "utf8"))
  delete pkg.packageManager
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n")
'
echo "client/ scaffolded"
