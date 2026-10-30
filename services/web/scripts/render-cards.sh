#!/usr/bin/env bash
# Renders the social cards (public/og/*.png, 1200x630) and the app icons (Apple
# touch icon, manifest icons) from cards/card.html and cards/touch-icon.html with
# headless Chrome. The PNGs are committed; rerun this after changing a page's
# name or pitch. Each card's art comes from the catalog's preview for that game,
# frozen in its reduced-motion frame. Keep the texts in step with each head.html.
#   services/web/scripts/render-cards.sh
set -euo pipefail
cd "$(dirname "$0")/.."
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
  || { echo "needs google-chrome or chromium" >&2; exit 1; }
profile="$(mktemp -d)"
page=cards/.card.tmp.html
trap 'rm -rf "$profile" "$page"' EXIT

# card.html plus the catalog's preview art and styles, so the two can't drift.
python3 - "$page" <<'PY'
import re, sys
site = open('public/index.html').read()
css = re.search(r'<style>(.*?)</style>', site, re.S).group(1).replace(':root', ':host')
art = ''.join(re.findall(r'<svg class="preview.*?</svg>', site, re.S))
card = open('cards/card.html').read().replace('<!-- previews -->', f'<style>{css}</style>{art}')
open(sys.argv[1], 'w').write(card)
PY

shot() { # shot <out.png> <width> <height> <url>
  "$chrome" --headless=new --disable-gpu --no-first-run --hide-scrollbars \
    --user-data-dir="$profile" --window-size="$2,$3" --virtual-time-budget=5000 \
    --force-prefers-reduced-motion \
    --screenshot="$PWD/$1" "$4" >/dev/null 2>&1
  echo "wrote $1"
}
card() { # card <name> <preview class> <eyebrow> <title> <text>
  local qs
  qs="$(python3 -c 'import sys, urllib.parse as u; print(u.urlencode({"art": sys.argv[1], "eyebrow": sys.argv[2], "title": sys.argv[3], "text": sys.argv[4]}))' "$2" "$3" "$4" "$5")"
  shot "public/og/$1.png" 1200 630 "file://$PWD/$page?$qs"
}

card catalog all "Small daily games" "WhileYouWait" \
  "Small daily puzzles for the build, the commute and the queue. A new one of each every day, no sign-up, no timers."
card timber tb "Daily path puzzle" "Timber" \
  "Topple wooden blocks into a path between two flags. One push can bring down a whole line, so plan the fall."
card runoff ro "Daily water puzzle" "Runoff" \
  "Shove soil around a hillside so the spring waters every field and misses every house. One shove can reroute the stream."
card poise po "Daily balance puzzle" "Poise" \
  "Swap the weights on a hanging mobile until every bar hangs level. Each bar only tells you which side is heavy."
card loom lm "Daily weaving puzzle" "Loom" \
  "Set the threads and treadles of a small loom so the cloth weaves the day's pattern. Every tap redraws the cloth."
card root-cause rc "Daily incident puzzle" "Root Cause" \
  "Alerts are cascading through the service graph. Work out which services really broke before the downtime adds up."
card flaky fl "Daily test-suite puzzle" "Flaky" \
  "CI is red and the tests depend on their order. Find the hidden dependencies in as little CI time as you can."
card hexroute hx "Daily light puzzle" "Hexroute" \
  "Rotate hex tiles to route red, green and blue light so each receiver gets exactly its colour."
shot public/apple-touch-icon.png 180 180 "file://$PWD/cards/touch-icon.html"
shot public/icon-192.png 192 192 "file://$PWD/cards/touch-icon.html"
shot public/icon-512.png 512 512 "file://$PWD/cards/touch-icon.html"
