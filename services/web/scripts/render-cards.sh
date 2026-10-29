#!/usr/bin/env bash
# Renders the social cards (public/og/*.png, 1200x630) and the Apple touch icon
# from cards/card.html and cards/touch-icon.html with headless Chrome. The PNGs
# are committed; rerun this after changing a page's name or pitch.
#   services/web/scripts/render-cards.sh
set -euo pipefail
cd "$(dirname "$0")/.."
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
  || { echo "needs google-chrome or chromium" >&2; exit 1; }
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

shot() { # shot <out.png> <width> <height> <url>
  "$chrome" --headless=new --disable-gpu --no-first-run --hide-scrollbars \
    --user-data-dir="$profile" --window-size="$2,$3" --virtual-time-budget=5000 \
    --screenshot="$PWD/$1" "$4" >/dev/null 2>&1
  echo "wrote $1"
}
card() { # card <name> <eyebrow> <title> <text>
  local qs
  qs="$(python3 -c 'import sys, urllib.parse as u; print(u.urlencode({"eyebrow": sys.argv[1], "title": sys.argv[2], "text": sys.argv[3]}))' "$2" "$3" "$4")"
  shot "public/og/$1.png" 1200 630 "file://$PWD/cards/card.html?$qs"
}

card catalog "Daily puzzles for developers" "WhileYouWait" \
  "Deduction puzzles for while the build runs. A new one of each every day, and no timers."
card root-cause "Daily incident puzzle" "Root Cause" \
  "Alerts cascade through a service graph. Find which services actually broke before the downtime adds up."
card flaky "Daily test-suite puzzle" "Flaky" \
  "CI is red because of hidden order dependencies between tests. Find them in as little CI time as you can."
card hexroute "Daily light-routing puzzle" "Hexroute" \
  "Rotate hex tiles to route red, green and blue light so each receiver gets exactly its colour."
shot public/apple-touch-icon.png 180 180 "file://$PWD/cards/touch-icon.html"
