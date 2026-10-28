# Contributing to Flaky

Flaky is one self-contained page: `index.html` holds the styles, the suite
generator, the bot and the UI. There is no build step.

## Run it

Build the production image and open it:

```bash
docker build -f .docker/Dockerfile -t flaky-web .
docker run --rm -p 8080:80 flaky-web   # http://localhost:8080
```

## Before opening a PR

- `node scripts/check-generator.mjs` must pass (CI enforces it).
- Keep everything above the `// ---------- rendering` marker in `index.html`
  free of DOM access; the check runs that part of the script on its own.

## Daily suite compatibility

The daily suite is derived from the date seed. Any change to the generator,
the name pool, the RNG, the costs or the bot changes today's suite or its bot
score for players who have not finished it, and makes results from before and
after incomparable. Say so explicitly in the PR when that happens.
