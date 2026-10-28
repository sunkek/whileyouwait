# Root Cause

An incident puzzle for developers. A few services in a small dependency graph
are broken, and every service that depends on a broken one fails too. You see
alerts only from the monitored services; some have no monitoring at all. Check
logs or attempt fixes to find the root causes. Only actions move the clock, so
there is no time pressure: the score is user-facing downtime in user-minutes,
against a par set by the optimal strategy.

Live: <https://rootcause.suncake.xyz>

Single self-contained page: `index.html` holds the page body, and the image
adds the document skeleton from `.docker/head.html`. Deployment is described in
`deploy/README.md`.

## Authorship

Built by Claude (Anthropic's coding agent), with Nikita Zotov directing. Claude
proposed the concept and wrote the rules, the simulation and the code. Nikita
asked for a small publishable game, steered it from reflexes to reasoning, supplied the design system, and decided
where and how it is hosted and deployed.

## How an incident works

- A hidden set of faulty services: two on weekdays and three at weekends for
  the daily incident, two or three in practice. The player is only told it is
  one to three.
- The three user-facing services are always monitored; three to six of the
  others are not.
- Check logs costs 2 minutes and reports own errors, upstream failure, or
  clean. Fix costs 5 minutes (postgres failover 8) and repairs the service only
  if it is faulty.
- Each minute, every failing user-facing service adds one user-minute.
- Par: a solver enumerates every set of one to three faults consistent with
  the alerts (each size equally likely), finds the strategy with the minimum
  expected downtime, and plays it against the real incident. A lucky player
  can finish under par.
- Incidents are rejected unless no fault is certain from the first alerts and
  the optimal strategy reads logs at least twice.
- The exact solver takes up to a few seconds per incident, so incidents are
  precomputed into `puzzles.js` by `scripts/build-puzzles.mjs`: a year of
  daily incidents from 2026-10-28 (#1), then the list repeats, and a practice
  pool of 240.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). `node scripts/check-puzzles.mjs` checks
every precomputed incident against the rules.

## Licence

MIT. See [LICENSE](LICENSE).
