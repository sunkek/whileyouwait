# WhileYouWait

Daily deduction puzzles for developers, for while the build runs. No timers.

Live: <https://whileyouwait.suncake.xyz>

| Game | Path | What it is |
|---|---|---|
| [Loom](services/loom/README.md) | `/loom/` | Weaving puzzle: set threads and treadles so the cloth weaves the day's pattern |
| [Root Cause](services/root-cause/README.md) | `/root-cause/` | Incident puzzle: find the broken services behind cascading alerts |
| [Flaky](services/flaky/README.md) | `/flaky/` | Test-pollution puzzle: find hidden order dependencies in as little CI time as you can |
| [Hexroute](services/hexroute/README.md) | `/hexroute/` | Rotate hex tiles to route additive RGB light |

Each game used to be its own repository and deployment; their histories are
merged in here under `services/<game>/`.

## Authorship

Built by Claude (Anthropic's coding agent), with Nikita Zotov directing. Claude
proposed the games and wrote their rules and code; Nikita chose the direction,
supplied the design system, and decided how the site is hosted and measured.

## How it is put together

- **One nginx image** (`services/web/`) serves the catalog page and every game.
  Each game is one self-contained page; the image joins its `head.html` and
  `index.html` into `/<game>/index.html`.
- **No backend.** Progress lives in the player's `localStorage`, keyed per game
  and per day.
- **Analytics: self-hosted Umami, no cookies.** Its tracker and collect endpoint
  are proxied under `/a/` on the same origin. On a game page,
  `services/web/public/shared/track.js` sends one `visit` event per day with
  how many earlier days this browser played that game (`prior`) and how long
  ago the last one was (`gap`). Both are read from the game's own dated saves,
  so no visitor ID is stored or sent. The Umami dashboard is not public.

## Quick start

```bash
docker network create dev           # once per machine; "exists" is fine
make gen-env APP=whileyouwait       # env/dev/*.env with fresh secrets
make up                             # site on :8080, Umami dashboard on :3901
```

Pages are baked into the image, so run `make up` again after editing one.
Umami starts with `admin` / `umami`; to see analytics locally, add a website
there and put its ID in `env/dev/web.env`. Without it the pages load no
tracker.

Checks CI runs:

```bash
node services/hexroute/scripts/check-generator.mjs
node services/root-cause/scripts/check-puzzles.mjs
node services/flaky/scripts/check-generator.mjs
node services/loom/scripts/check-generator.mjs
node services/web/scripts/check-track.mjs
```

## Layout

```
services/web         # catalog page, shared/track.js, the nginx image
services/<game>      # one directory per game: index.html, head.html, checks
infra                # dev compose stack (Postgres, Umami, web)
env                  # dev env files (example/ is the template)
deploy               # production compose file and how the host runs it
```

`CLAUDE.md` maps the docs; `deploy/README.md` covers production.

## Status

Experiment, not a business. Parked analysis and the test that decides whether
it goes further: idea #15 in Nikita's ideas backlog. In short: measure
unprompted day-7 returns before building streaks, leaderboards or anything
that needs accounts.

## Licence

MIT. See [LICENSE](LICENSE).
