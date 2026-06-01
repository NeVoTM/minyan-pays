#!/usr/bin/env bash
# Creates the GitHub repo and pushes — run locally with a token that has repo scope.
set -euo pipefail

OWNER="${1:-NeVoTM}"
REPO="slinkys"

gh repo create "${OWNER}/${REPO}" \
  --public \
  --description "LucLoft716 salon suite booking — Deskpass-style on-demand workspace for beauty professionals" \
  --source=. \
  --remote=origin \
  --push

echo "Done: https://github.com/${OWNER}/${REPO}"
