# Root Cause

A 90-second on-call shift. Faults land on services in a small dependency graph
and cascade upward: every service that depends on a broken one starts alerting
too. Tap the broken service to fix it. Tapping a symptom costs time and finds
nothing. Uptime counts only the three user-facing services, against an 80%
SLO.

Live: <https://rootcause.suncake.xyz>

Single self-contained page: `index.html` holds the page body, and the image
adds the document skeleton from `.docker/head.html`. Deployment is described in
`deploy/README.md`.

## Authorship

Built by Claude (Anthropic's coding agent), with Nikita Zotov directing. Claude
proposed the concept and wrote the rules, the simulation and the code. Nikita
asked for a small publishable game, supplied the design system, and decided
where and how it is hosted and deployed.

## How a shift works

- Faults follow a seeded schedule whose rate rises from one per ~9 s to one
  per ~3.4 s. Each fault picks a healthy service, weighted away from postgres
  and the user-facing services.
- One engineer, one action at a time: a fix takes 0.8 s (postgres 1.5 s), a
  probe of a service that isn't broken takes 0.7 s.
- Uptime is user-facing service-seconds up over the shift. MTTR is the mean
  time from a fault to its fix.
- The daily shift is seeded from the local date; #1 is 2026-10-28. Practice
  shifts are random.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). `node scripts/check-balance.mjs` checks
the difficulty band with scripted players.

## Licence

MIT. See [LICENSE](LICENSE).
