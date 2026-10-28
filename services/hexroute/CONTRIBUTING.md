# Contributing to Hexroute

Hexroute is one self-contained page: `index.html` holds the styles, the puzzle
generator, and the UI. There is no build step.

## Run it

Open `index.html` through any static server, or build the production image:

```bash
docker build -f .docker/Dockerfile -t hexroute-web .
docker run --rm -p 8080:80 hexroute-web   # http://localhost:8080
```

## Before opening a PR

- `node scripts/check-generator.mjs` must pass (CI enforces it). It generates
  puzzles at every size and checks each one starts unsolved and is solvable.
- Keep everything above the `// ---------- rendering` marker in `index.html`
  free of DOM access; the check runs that part of the script on its own.

## Daily puzzle compatibility

The daily puzzle is derived from the date seed. Any change to the generator or
to the random number generator changes every future daily puzzle, and the one
players have in progress today. Say so explicitly in the PR when that happens.
