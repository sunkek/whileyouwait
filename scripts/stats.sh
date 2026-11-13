#!/usr/bin/env bash
# Prints a production analytics report: `make stats`. Read-only. Talks to the
# shared Umami's public API (the infra repository runs it, docs/UMAMI.md there)
# and needs age and the admin password in ~/secrets/umami-pass.age, encrypted
# to the age key below.
#
#   STATS_URL=http://localhost:3901 scripts/stats.sh   # the dev stack's Umami
set -euo pipefail

cd "$(dirname "$0")/.."
PASS_FILE="${STATS_PASS_FILE:-$HOME/secrets/umami-pass.age}"
AGE_KEY="${STATS_AGE_KEY:-$HOME/.config/sops/age/keys.txt}"
STATS_URL="${STATS_URL:-https://u-i.suncake.xyz}"

# The password goes over stdin, so it never appears in a process list.
age -d -i "$AGE_KEY" "$PASS_FILE" | STATS_URL="$STATS_URL" node scripts/stats.mjs "$@"
