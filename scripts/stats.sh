#!/usr/bin/env bash
# Prints a production analytics report: `make stats`. Opens its own SSH tunnel to
# Umami on a spare local port (the dev stack holds 3901) and closes it on exit.
# Read-only. Needs ssh access to the host, age, and the admin password in
# ~/secrets/umami-pass.age, encrypted to the age key below.
#
#   STATS_URL=http://[::1]:3901 scripts/stats.sh   # use a tunnel that's already open
set -euo pipefail

cd "$(dirname "$0")/.."
HOST="${STATS_HOST:-sunn-agorabot}"
PORT="${STATS_PORT:-3911}"
PASS_FILE="${STATS_PASS_FILE:-$HOME/secrets/umami-pass.age}"
AGE_KEY="${STATS_AGE_KEY:-$HOME/.config/sops/age/keys.txt}"

if [ -z "${STATS_URL:-}" ]; then
  # With -f and ExitOnForwardFailure, ssh returns only once it holds the port, and
  # fails if anything else does, so the password can't reach another local process.
  control="$(mktemp -d)"
  trap 'ssh -S "$control/ssh" -O exit "$HOST" 2>/dev/null || true; rm -rf "$control"' EXIT
  ssh -f -N -M -S "$control/ssh" -o ExitOnForwardFailure=yes -L "127.0.0.1:$PORT:127.0.0.1:3901" "$HOST" \
    || { echo "could not open the tunnel: is local port $PORT free?" >&2; exit 1; }
  STATS_URL="http://127.0.0.1:$PORT"
fi

# The password goes over stdin, so it never appears in a process list.
age -d -i "$AGE_KEY" "$PASS_FILE" | STATS_URL="$STATS_URL" node scripts/stats.mjs "$@"
