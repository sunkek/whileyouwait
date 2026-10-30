# Chute

A daily marble puzzle. Eight numbered marbles drop one at a time through a run of seven levers into five cups. Flip
levers before the run so every marble lands in a cup of its colour. Par is the fewest flips that do it.

Live: <https://whileyouwait.suncake.xyz/chute/>, part of the [WhileYouWait](../../README.md) catalog.

Single self-contained page: `index.html` holds the page body, and the catalog's image adds the document skeleton from
`head.html`, which also loads the catalog's analytics, the shared page styles (`/shared/game.css`) and the shared daily
helpers (`/shared/daily.js`). Deployment is described in `deploy/README.md` at the repository root.

## Rules

A marble rolls to the low end of any lever it meets, and the lever then tips the other way. That is the only rule, so
one flip changes the route of every marble after it. A lever no earlier marble has touched can't disturb them, which
lets a player solve the run marble by marble.

Following a marble shows its route and the levers as that marble found them. Flipping a lever inverts it at every moment
of the run, so flipping while following stays consistent.

## How puzzles are made

- Boards are generated in the page in about a millisecond. Each try tries every one of the 128 lever settings.
- The marbles' colours come from running a hidden solution, so a solution always exists.
- A board is kept when it has at most three solutions, every lever is hit at the start and in that solution, and a start
  exists three or four flips from the nearest solution with at least half the marbles stray.
- Par is the exact distance to the nearest solution.
- The daily is seeded from the local date; #1 is 2026-10-31. Changing the generator, the RNG or any board size changes
  every daily.

## History

- The first playtest used 12 marbles, 10 levers and par 4-6, and rejected boards where following the stray count works.
  It was too hard: 8 marbles, 7 levers and par 3-4 play better, and about one board in five now yields to the stray count.
- The pour was first about four times faster, too quick to read. A tap on the board now speeds it up on request.
- Marbles enter on the middle lane, so a top-row lever on the left lanes was unreachable until the generator began
  requiring every lever to be hit.

## Development

See [CONTRIBUTING.md](../../CONTRIBUTING.md). `node services/chute/scripts/check-generator.mjs` checks 400 boards against
the rules above.
