# Contributing to Root Cause

Root Cause is one self-contained page: `index.html` holds the styles, the
simulation, and the UI. There is no build step.

## Run it

Build the production image and open it:

```bash
docker build -f .docker/Dockerfile -t rootcause-web .
docker run --rm -p 8080:80 rootcause-web   # http://localhost:8080
```

## Before opening a PR

- `node scripts/check-balance.mjs` must pass (CI enforces it). It plays shifts
  with scripted players and checks the difficulty band: a player fixing the
  right root cause at human reaction speed usually meets the 80% SLO, and a
  player who never acts never does.
- Keep everything above the `// ---------- rendering` marker in `index.html`
  free of DOM access; the check runs that part of the script on its own.

## Daily shift compatibility

The daily shift is derived from the date seed. Any change to the fault
schedule, the graph, or the timings changes today's shift for players who have
not played it yet, and makes scores from before and after incomparable. Say so
explicitly in the PR when that happens.
