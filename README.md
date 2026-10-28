# Root Cause

An incident puzzle for developers. Each incident runs on a different, randomly
generated architecture of user-facing apps, services and datastores. A few
services are broken, and every service that depends on a broken one fails too. You see
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

- The architecture is drawn from a role catalogue in `index.html`: three of
  five user-facing apps, the three to five services they call, and the two to
  four datastores those use. Every edge must be one the catalogue allows
  (cart may use redis and postgres, notify may use kafka and redis, and so
  on), and each tier is ordered by its parents' positions to limit crossing
  arrows. Eight to twelve services per incident; the solver's bitmasks cap it
  at twelve.
- A hidden set of faulty services: two on weekdays and three at weekends for
  the daily incident, two or three in practice. The player is only told it is
  one to three.
- The three user-facing apps are always monitored; three to six of the other
  services are not.
- Check logs costs 2 minutes and reports own errors, upstream failure, or
  clean. Fix costs 5 minutes, failing over a datastore 8, and repairs the
  service only if it is faulty.
- Each minute, every failing user-facing service adds one user-minute.
- Par: a solver enumerates every set of one to three faults consistent with
  the alerts (each size equally likely), finds the strategy with the minimum
  expected downtime, and plays it against the real incident. A lucky player
  can finish under par.
- Incidents are rejected unless no fault is certain from the first alerts and
  the optimal strategy reads logs at least twice.
- The exact solver takes up to a few seconds per incident, so incidents are
  precomputed into `puzzles.js` by `scripts/build-puzzles.mjs`, with a practice
  pool of 240. A weekly workflow (`.github/workflows/puzzles.yml`) appends daily
  incidents so the list always runs 90 days ahead, drops days older than a
  week, commits, and triggers a deploy. Existing days are never regenerated.
  Daily #1 is 2026-10-28.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). `node scripts/check-puzzles.mjs` checks
every precomputed incident against the rules.

## Licence

MIT. See [LICENSE](LICENSE).
