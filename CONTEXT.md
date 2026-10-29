# WhileYouWait

The vocabulary of this codebase.

## Language

### The site

**Catalog**:
The landing page at `/`, listing every game. Lives in `services/web/public/`.
_Avoid_: portal, home, hub

**Game**:
One self-contained puzzle page under `/<game>/`, with its source in
`services/<game>/`.

**Daily**:
The puzzle every player gets for a given local date. Each game also has a
practice mode, which is never saved, so practice alone never makes a prior
day.

**Save**:
A game's `localStorage` entry for one day, keyed `<prefix><YYYY-MM-DD>`.
Written on the first move, not on load.

### Analytics

**Visit** (event):
The Umami event `track.js` sends on the first load of a game on a given day,
with `game`, `prior` (earlier days with a save, capped at 30) and `gap` (days
since the latest of them, 0 for a new player, capped at 30).
_Avoid_: session (Umami's own term for its short-lived visitor hash)

**Return**:
A visit with `prior` > 0. Day-7 returns are visits with `gap` 7 or more.

### Builds and environments

**Service** (compose):
A container in a Docker Compose stack. Only ever means this.
_Avoid_: app, container name (services address each other by network alias)

**Environment**:
`dev` (the compose stack in `infra/`) or `prod` (the stack in `deploy/` on the
host). Each has its own env files and secrets.
_Avoid_: deployment, profile (`profile` is a Compose term, used here only for
the `app` profile)
