# Contributing to Root Cause

Root Cause is one self-contained page: `index.html` holds the styles, the
puzzle generator and solver, and the UI. There is no build step.

## Run it

Build the production image and open it:

```bash
docker build -f .docker/Dockerfile -t rootcause-web .
docker run --rm -p 8080:80 rootcause-web   # http://localhost:8080
```

## Before opening a PR

- `node scripts/check-puzzles.mjs` must pass (CI enforces it). It generates
  incidents at every difficulty and checks that the real fault set is a
  possible explanation of the alerts, that the par strategy resolves it, and
  that generation is deterministic and fast.
- Keep everything above the `// ---------- rendering` marker in `index.html`
  free of DOM access; the check runs that part of the script on its own.

## Daily incident compatibility

The daily incident is derived from the date seed. Any change to the generator,
the graph, or the action costs changes today's incident for players who have
not played it yet, and makes scores from before and after incomparable. Say so
explicitly in the PR when that happens.
