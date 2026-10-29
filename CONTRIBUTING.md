# Contributing

## Ground rules

- Coding style, testing rules and commit format live in [`AGENTS.md`](AGENTS.md). Read it first.
- [`CLAUDE.md`](CLAUDE.md) maps the docs; `make help` lists every command.
- [`CONTEXT.md`](CONTEXT.md) is the glossary. Name things with its words, and extend it when you introduce a concept it does not cover.

## Getting set up

Follow the quick start in [`README.md`](README.md).

## Before you open a PR

Run what CI runs ([`.github/workflows/ci.yml`](.github/workflows/ci.yml) is the
authority): the game checks, `node services/web/scripts/check-track.mjs`, and a
local `make up` to look at the pages you changed.

- A change to a generator, RNG or scoring changes every daily puzzle. Say so in the PR.
- Update `CLAUDE.md` if you added a convention no lookup would reveal.

## Reporting issues

Include what you did, what you expected, what happened, the game and the date
of the puzzle. For security issues, follow [`SECURITY.md`](SECURITY.md) instead
of opening a public issue.
