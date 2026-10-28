# Flaky

A test-pollution puzzle for developers. CI went red: a suite of eight tests
hides exactly three order dependencies. Each is either "X pollutes Y" (Y fails
if X ran earlier in the same run) or "X sets up Y" (Y fails unless X ran
earlier). You compose runs, any tests in any order, read which tests pass and
fail, and name all three dependencies. Nothing moves until you act, so there
is no time pressure: the score is CI time, against a greedy bot.

Live: not deployed yet (planned: <https://flaky.suncake.xyz>)

Single self-contained page: `index.html` holds the page body, and the image
adds the document skeleton from `.docker/head.html`. Deployment is described in
`deploy/README.md`.

## Authorship

Built by Claude (Anthropic's coding agent), with Nikita Zotov directing. Claude
proposed the concept and wrote the rules, the generator, the bot and the code.
Nikita asked for a game in the vein of Root Cause and Hexroute and supplied the
design system.

## How a suite works

- Eight tests, picked from a name pool and sorted into file order, each taking
  one to three seconds. Three hidden dependencies, drawn from the 112 possible
  ones (two kinds × 56 ordered pairs). A pair can't both pollute and set up the
  same test, and two tests can't each need the other first.
- The free first run is CI's: the whole suite in file order. A suite is
  rejected unless that run fails something and no dependency is certain from
  it alone. Typically a few thousand hypotheses remain.
- Each player run costs a 4 second boot plus the duration of every test in it.
  One diagnosis, judged as a set; a wrong one ends the game.
- The bot enumerates every hypothesis still consistent with the runs so far
  and, from a fixed candidate set (every run of one to three tests, the full
  suite both ways, 300 seeded random runs of four to eight tests), picks the
  run with the most expected information per second. It is greedy, not
  optimal: a careful player can beat it, and sometimes it beats a careful
  player.
- Everything runs in the page (generation plus bot is about 100 ms). The
  daily suite is seeded from the local date; #1 is 2026-10-28.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). `node scripts/check-generator.mjs`
checks 100 suites against the rules and prints how ambiguous they start.

## Status

Toy, not a product. Same test as its siblings before any further work: share
with 10-20 people and look for unprompted day-3 and day-7 returns.

## Licence

MIT. See [LICENSE](LICENSE).
