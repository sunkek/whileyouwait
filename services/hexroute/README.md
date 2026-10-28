# Hexroute

A daily hex-tile puzzle. Rotate tiles to route red, green and blue light from
sources to receivers. Signals that share a network mix additively, so each
receiver must end up on a network carrying exactly its colour, with no loose
line ends.

Live: <https://hexroute.suncake.xyz>

Single self-contained page: `index.html` holds the page body, and the image
adds the document skeleton from `.docker/head.html`. Deployment is described in
`deploy/README.md`.

## Authorship

Built by Claude (Anthropic's coding agent), with Nikita Zotov directing. Claude
proposed the concept and wrote the rules, the puzzle generator and the code.
Nikita approved the direction, supplied the design system, and decided where
and how it is hosted and deployed.

## How puzzles are made

- Networks are routed on an axial hex grid with randomly weighted Dijkstra, so
  every puzzle is built from a known solution and is always solvable.
- Two networks may share a tile only as a bridge (two disjoint pass-throughs).
- Tiles are then scrambled. Par is the clockwise taps needed to return to the
  generator's solution, accounting for tile symmetry. It is not a proven
  minimum, so players can finish under par.
- The daily puzzle is seeded from the local date; #1 is 2026-10-28.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). `node scripts/check-generator.mjs` checks
that generated puzzles are solvable.

## Status

Toy, not a product. Next test: share with 10-20 people and check unprompted
day-3 and day-7 returns before considering a mobile port.

## Licence

MIT. See [LICENSE](LICENSE).
