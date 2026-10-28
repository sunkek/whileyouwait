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

- A hidden set of k faulty services (k = 2 on weekdays and 3 at weekends for the
  daily incident; 1-3 in practice). The player is told k.
- The three user-facing services are always monitored; three to six of the
  others are not.
- Check logs costs 2 minutes and reports own errors, upstream failure, or
  clean. Fix costs 5 minutes (postgres failover 8) and repairs the service only
  if it is faulty.
- Each minute, every failing user-facing service adds one user-minute.
- Par: a solver enumerates every fault set consistent with the alerts, finds
  the strategy with the minimum expected downtime over them, and plays it
  against the real incident. A lucky player can finish under par.
- Incidents are generated from a seed and rejected unless they leave at least
  three suspects (two for k = 1) and, for k > 1, the optimal strategy needs a
  log check. The daily incident is seeded from the local date; #1 is
  2026-10-28.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). `node scripts/check-puzzles.mjs` checks
that generated incidents are consistent, solvable at par, and fast to build.

## Licence

MIT. See [LICENSE](LICENSE).
