# Hexroute

A daily hex-tile puzzle. Rotate tiles to route red, green and blue light from
sources to receivers. Signals that share a network mix additively, so each
receiver must end up on a network carrying exactly its colour, with no loose
line ends.

Single self-contained page: `index.html`. Published as a private artifact at
https://claude.ai/artifact/6NVqBRB73ZTfo4aM9P6zwD.

## How puzzles are made

- Networks are routed on an axial hex grid with randomly weighted Dijkstra, so
  every puzzle is built from a known solution and is always solvable.
- Two networks may share a tile only as a bridge (two disjoint pass-throughs).
- Tiles are then scrambled. Par is the clockwise taps needed to return to the
  generator's solution, accounting for tile symmetry. It is not a proven
  minimum, so players can finish under par.
- The daily puzzle is seeded from the local date; #1 is 2026-10-28.

## Status

Toy, not a product. Next test: share with 10-20 people and check unprompted
day-3 and day-7 returns before considering a mobile port.
