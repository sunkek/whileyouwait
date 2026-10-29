# Runoff

A daily water puzzle. A spring at the top of a small hillside sends water down
to the river; shove soil from square to square until the water reaches every
field and stays out of every house.

Live: <https://whileyouwait.suncake.xyz/runoff/>, part of the
[WhileYouWait](../../README.md) catalog.

Single self-contained page: `index.html` holds the page body, and the
catalog's image adds the document skeleton from `head.html`, which also loads
the catalog's analytics and the shared page styles (`/shared/game.css`). Deployment is described in `deploy/README.md` at the
repository root.

## Rules

- The hillside is 6 × 8 squares, heights 0-6, walled on three sides, with the
  river below the last row.
- Running water steps only to its lowest neighbour, splitting only on ties.
  A square that is lower but not the lowest stays dry. Running water into every
  lower neighbour was tried: it wet 42 of 48 squares and flooded 68 of 90
  houses on solved hillsides, which leaves no puzzle.
- Water with no lower neighbour pools: the pool takes in its lowest edge
  squares until one is lower than its surface, and spills there. Before it
  spills it also takes in every edge square level with its surface, so a
  square touching a pool at or below the surface is always under water.
- A move is a shove: one unit of soil from a square onto a neighbour. Fields,
  houses and the spring can't be dug or built on. A move to any square was
  tried first; every day then had a two-move solution.
- The board is drawn isometric and can be turned a quarter at a time, since a
  tall block hides squares behind it.

## How puzzles are made

- Terrain is a slope down to the river with noise and three mounds; the spring
  sits on the top row at height 6.
- On that solved terrain, 3 fields are picked among wet squares and 3 houses
  among dry squares beside the water.
- The start is 5-7 random shoves near the water. It is kept only when at least
  three goals fail, a greedy player (the shove leaving fewest goals unmet,
  ties at random) fails three times, and no solution takes fewer than 3 shoves.
- Par is the fewest shoves, found by iterative deepening over shoves that touch
  the water or a square beside it. In a shortest solution a shove touching
  neither can be dropped without changing the water, so nothing is missed.
  Terrains already searched are skipped. If the search passes 1M positions it
  gives up and par is the scramble's length, so a player can beat it on those
  days (about 1 in 15).
- The search runs on a second, allocation-free simulator (`wetSquares`), about
  50 times faster than the drawn one; the check compares the two.
- The daily is seeded from the local date; #1 is 2026-10-29. Changing the
  generator, the RNG, the rules or the search budget changes every daily.

## Development

See [CONTRIBUTING.md](../../CONTRIBUTING.md). `node scripts/check-generator.mjs`
checks 60 hillsides: the solved terrain meets its goals, the start breaks at
least three, soil is conserved and locked squares unmoved, par is at least 3
and reachable when found by search, the two simulators agree, generation is
deterministic and its median under a second.

## Licence

MIT. See [LICENSE](../../LICENSE).
