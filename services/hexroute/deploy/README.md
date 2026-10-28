# Deploy Hexroute

Production runs as a single nginx container on `sunn-agorabot`, behind that
host's shared Traefik, defined in `deploy/docker-compose.prod.yml` and installed
at `/opt/hexroute`.

Public URL: **https://hexroute.suncake.xyz** (proxied by Cloudflare through the
`*.suncake.xyz` wildcard record). Traefik's `letsencrypt` resolver issues the
origin certificate.

## Layout on the host

```
/opt/hexroute/
  docker-compose.prod.yml   # copy of deploy/docker-compose.prod.yml
  .env                      # WEB_TAG — CI rewrites it
/opt/ci-deploy.sh           # forced command for the CI deploy key
```

The GHCR package is public, so no registry login is needed.

## Deploy by hand

```bash
ssh sunn-agorabot
cd /opt/hexroute
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --wait
```

## Continuous deploy

Pushes to `main` build `ghcr.io/sunkek/hexroute-web` and deploy via the `deploy`
job in `.github/workflows/images.yml`. It SSHes in as `deploy` with a key that
`authorized_keys` pins to `command="/opt/ci-deploy.sh hexroute",restrict`, and
sends only `WEB_TAG=<sha>`. The script refuses anything else, writes the tag
into `.env`, pulls and runs `up -d --wait`.

Repo secrets: `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`. Without
`DEPLOY_SSH_KEY` the job no-ops and stays green.

The host rate-limits SSH (`ufw limit`): about six connections in quick
succession are refused for a minute. One deploy is one connection.
