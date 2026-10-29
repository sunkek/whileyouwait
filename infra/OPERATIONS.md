# Operations (dev)

Production does not run from `infra/`. It is `deploy/docker-compose.prod.yml`
on the host; see [`deploy/README.md`](../deploy/README.md).

## Docker stack

`infra/docker-compose.yml` is the base stack and `docker-compose.dev.yml` the
dev override that publishes ports. `make up` merges them and brings up the
`app` profile:

- `postgresql`: Umami's database (`APP_DB`).
- `umami`: analytics, dashboard on `127.0.0.1:$WHILEYOUWAIT_UMAMI_PORT`
  (default 3901). It creates and migrates its schema on start.
- `web`: the catalog and games on `127.0.0.1:$WHILEYOUWAIT_WEB_PORT`
  (default 8080), built from `services/`. Pages are baked in, so edits need
  another `make up`.

`make run` starts only `postgresql`. Container and volume names carry the
`$ENVIRONMENT` suffix; services find each other through network aliases.

## Env files

`make gen-env APP=whileyouwait` materializes `env/dev/*.env` from
`env/example/`, replacing `password` placeholders with random secrets. The
Makefile sources `ports.env` and `postgresql.env` before every compose call;
Umami's `DATABASE_URL` is interpolated from the latter's `APP_*` values.

| File | Holds |
|---|---|
| `ports.env` | host-side ports |
| `postgresql.env` | superuser and app credentials |
| `umami.env` | `APP_SECRET`, which signs dashboard sessions |
| `web.env` | `UMAMI_WEBSITE_ID`; empty means no tracker |

Add a variable with `make env-add` rather than by hand ([`docs/SECRETS.md`](../docs/SECRETS.md)).
Production secrets are not in this repository at all: they live in
`/opt/whileyouwait/.env` on the host.

## Analytics locally

Log in to the dashboard with `admin` / `umami`, add a website, put its ID in
`env/dev/web.env` and run `make up`. Umami drops visits from headless browsers
by user agent, so a headless test needs a normal `--user-agent`.

## Backup and restore

```bash
make pg-dump                                  # -> infra/postgresql/backup/<timestamp>.sql
make pg-restore DUMP_FILE=infra/postgresql/backup/<file>.sql
```

For production backups see `deploy/README.md`.

## Logs and health

```bash
make logs                        # follow every container in the stack
make ps                          # what is running
```
