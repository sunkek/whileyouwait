# Deploy WhileYouWait

Production runs as a docker compose stack on `sunn-agorabot`, behind that
host's shared Traefik: the `web` nginx image alone, defined in
`deploy/docker-compose.prod.yml` and installed at `/opt/whileyouwait`. It holds
no state. Analytics go to the shared Umami at https://u-i.suncake.xyz, which the
infra repository runs for every project (`docs/UMAMI.md` there); until
November 2026 Postgres and Umami were part of this stack.

Public URL: **https://whileyouwait.suncake.xyz** (proxied by Cloudflare through
the `*.suncake.xyz` wildcard record). Traefik's `letsencrypt` resolver issues
the origin certificate.

Cloudflare overrides nginx's `no-cache` on CSS and JS with `max-age=14400`, so a
browser may keep them for 4 hours. HTML is left alone. The image build therefore
puts a content hash in every shared file's and `puzzles.js`'s URL, so a new page
always asks for the matching file; don't remove that step. `config.js` has no
hash, because nginx renders it at container start.

The pages load Umami's tracker from `u-i.suncake.xyz` and send events there,
so the CSP in the compose file names that host in `script-src` and
`connect-src`. `config.js` carries the website ID and the host.

## Layout on the host

```
/opt/whileyouwait/
  docker-compose.prod.yml   # copy of deploy/docker-compose.prod.yml
  .env                      # mode 600: secrets, website ID, image tag
/opt/ci-deploy.sh           # forced command for the CI deploy key
```

`.env`:

| Key | Notes |
|---|---|
| `UMAMI_WEBSITE_ID` | The Umami website the pages report to; empty means no tracker |
| `WEB_TAG` | Image SHA; CI rewrites it on every deploy |

The GHCR package is public, so no registry login is needed.

## Analytics

`make stats` prints a report from Umami's API: it logs in with the password
from `~/secrets/umami-pass.age` and reads. `scripts/stats.sh 7` limits it to the
last 7 days. The dashboard is https://u-i.suncake.xyz.

The `visit` event carries `game`, `prior` and `gap` (see `CONTEXT.md`). Day-7
returns for a game: Events → `visit`, filter `game`, and look at the share
with `gap` ≥ 7 and `prior` > 0.

To stop counting your own play, run `localStorage.setItem('umami.disabled', '1')`
in the console on whileyouwait.suncake.xyz, once per browser.

## Deploy by hand

```bash
ssh sunn-agorabot
cd /opt/whileyouwait
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --wait --remove-orphans
```

## Continuous deploy

Pushes to `main` build `ghcr.io/sunkek/whileyouwait-web` and deploy via the
`deploy` job in `.github/workflows/images.yml`. It SSHes in as `deploy` with a
key that `authorized_keys` pins to
`command="/opt/ci-deploy.sh whileyouwait",restrict`, and sends only
`WEB_TAG=<sha>`. The script refuses anything else, writes the tag into `.env`,
pulls and runs `up -d --wait`. A leaked key can only redeploy existing image
tags of this app.

`/opt/ci-deploy.sh` is root's and only accepts the app names in its `case`
allowlist, so a new app on this host needs `sudo` to be added there. Some
`/opt/<app>` directories set up earlier are root's as well, so removing one can
need `sudo` even though `deploy` created `/opt/whileyouwait` itself.

Repo secrets: `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`. Without
`DEPLOY_SSH_KEY` the job no-ops and stays green.

The weekly `puzzles` workflow commits new Root Cause dailies and dispatches the
image build, so it deploys too.

The host rate-limits SSH (`ufw limit`): about six connections in quick
succession are refused for a minute. One deploy is one connection.

## Backups

Nothing here to back up: player progress is in players' browsers and never
reaches the server, and analytics are backed up with the shared Umami (infra
repository, `docs/UMAMI.md`).
