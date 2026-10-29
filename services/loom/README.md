# Loom

A daily weaving puzzle. A small four-frame loom weaves a 16×16 cloth: each
vertical thread hangs on one of four frames (the threading), each pass presses
one of four treadles (the treadling), and a fixed tie-up says which frames each
treadle lifts. Where a pass lifts a thread's frame, the thread shows. Set the
threading and treadling so the cloth matches the day's target pattern.

Live: <https://whileyouwait.suncake.xyz/loom/>, part of the
[WhileYouWait](../../README.md) catalog.

Single self-contained page: `index.html` holds the page body, and the
catalog's image adds the document skeleton from `head.html`, which also loads
the catalog's analytics and the shared page styles (`/shared/game.css`). Deployment is described in `deploy/README.md` at the
repository root.

## How puzzles are made

- The target comes from a real weaving draft: one of four classic four-frame
  tie-ups (2/2, 3/1 and 1/3 twill, broken twill), a point threading from a
  bouncing ±1 walk over the frames, and a treadling that either repeats the
  threading ("as drawn in", which weaves symmetric diamonds) or walks on its
  own. Drafts whose cloth is under 20% or over 80% one colour are rejected.
- The start steps a random half or so of the threads and passes back by one
  to three positions. Par is the forward taps that undo that, so it is not a
  proven minimum: another setup may weave the same cloth in fewer taps.
- Any setup whose cloth matches the target wins.
- "Give me a tip" rings the wrong cells and marks the result as assisted.
- The daily is seeded from the local date; #1 is 2026-10-29. Changing the
  generator, the RNG, the tie-ups or the dyes changes every daily.

## Development

See [CONTRIBUTING.md](../../CONTRIBUTING.md). `node scripts/check-generator.mjs`
checks 400 puzzles against the rules: unwoven at the start, the constructed
setup weaves the target, par equals the undo taps, generation is deterministic
and fast.

## Licence

MIT. See [LICENSE](../../LICENSE).
