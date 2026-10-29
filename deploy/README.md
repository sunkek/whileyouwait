# Deploy WhileYouWait

Production runs as a docker compose stack on `sunn-agorabot`, behind that
host's shared Traefik: Postgres, Umami and the `web` nginx image, defined in
`deploy/docker-compose.prod.yml` and installed at `/opt/whileyouwait`.

Public URL: **https://whileyouwait.suncake.xyz** (proxied by Cloudflare through
the `*.suncake.xyz` wildcard record). Traefik's `letsencrypt` resolver issues
the origin certificate.

Only `web` is on the `traefik` network. It serves the pages and proxies the
Umami tracker (`/a/s.js`) and collect endpoint (`/a/api/send`) to `umami` over
the project's own network. The Umami dashboard is not routed at all.

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
| `POSTGRES_PASSWORD` | Baked into the volume on first boot, see below |
| `UMAMI_APP_SECRET` | Signs dashboard sessions; rotating it logs you out, nothing else |
| `UMAMI_WEBSITE_ID` | The Umami website the pages report to; empty means no tracker |
| `WEB_TAG` | Image SHA; CI rewrites it on every deploy |

> **The Postgres password, once set, stays set.** The image reads
> `POSTGRES_PASSWORD` only when it initialises an empty volume. To rotate it,
> `ALTER USER umami PASSWORD '…'` inside the running database and update
> `.env` to match.

The GHCR package is public, so no registry login is needed.

## Umami dashboard

It listens on the host's loopback only (`127.0.0.1:3901`). Tunnel to it:

```bash
ssh -N -L 3901:127.0.0.1:3901 sunn-agorabot
# then open http://localhost:3901
```

The `visit` event carries `game`, `prior` and `gap` (see `CONTEXT.md`). Day-7
returns for a game: Events → `visit`, filter `game`, and look at the share
with `gap` ≥ 7 and `prior` > 0.

## Deploy by hand

```bash
ssh sunn-agorabot
cd /opt/whileyouwait
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --wait
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

The only state is analytics, in the `whileyouwait_postgres-data` volume. Losing
it loses history, not the site. To take a dump:

```bash
ssh sunn-agorabot 'docker exec whileyouwait_postgres pg_dump -U umami umami' > umami-$(date +%F).sql
```

Player progress is in players' browsers and never reaches the server.
