# Poise

A daily balance puzzle. Weights hang from a mobile of bars; a bar is level
when weight × distance is the same on both sides, where the distance is the
number of notches from the pivot to the hook and a side's weight is everything
hanging below it. Swap the weights until every bar hangs level.

Live: <https://whileyouwait.suncake.xyz/poise/>, part of the
[WhileYouWait](../../README.md) catalog.

Single self-contained page: `index.html` holds the page body, and the
catalog's image adds the document skeleton from `head.html`, which also loads
the catalog's analytics. Deployment is described in `deploy/README.md` at the
repository root.

## How puzzles are made

- A random tree of 9-10 hooks, 4-5 bars deep, with arms of 1-3 notches
  (reduced, so 2:2 is drawn as 1:1).
- A mobile with n hooks has n - 1 bars, one equation each, so its level
  weights are fixed up to scale. The generator builds the smallest
  whole-number solution bottom up and multiplies it, keeping weights distinct
  and at most 30.
- Kept only when exactly one arrangement of those weights hangs level
  (counted top down: a bar's total fixes what each side must weigh) and the
  drawing fits 500 units across, so it stays legible on a phone.
- The start is a shuffle at least 6 swaps from the solution with at most one
  bar level. Fewest is the exact minimum: hooks minus the cycles of that
  shuffle.
- An unbalanced bar leans by a fixed angle toward its heavy side. That is a
  design decision: with a lean proportional to the imbalance, a greedy
  swap-follower solved 98 of 100 days; with direction only, about 13.
- The daily is seeded from the local date; #1 is 2026-10-29. Changing the
  generator, the RNG or the limits changes every daily.

## Development

See [CONTRIBUTING.md](../../CONTRIBUTING.md). `node scripts/check-generator.mjs`
checks 300 mobiles against the rules: one level arrangement, distinct weights,
a start at least 6 swaps away with at most one bar level, par equal to the
fewest swaps, the width limit, determinism and speed.

## Licence

MIT. See [LICENSE](../../LICENSE).
