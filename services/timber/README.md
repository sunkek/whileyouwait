# Timber

A daily path puzzle. Wooden blocks stand on a 5×5 board, with a flag on each side. Topple them so the fallen blocks
form a path from flag to flag, without letting a sage block fall. Par is the fewest pushes that can do it.

Live: <https://whileyouwait.suncake.xyz/timber/>, part of the [WhileYouWait](../../README.md) catalog.

Single self-contained page: `index.html` holds the page body, and the catalog's image adds the document skeleton from
`head.html`, which also loads the catalog's analytics, the shared page styles (`/shared/game.css`) and the shared daily
helpers (`/shared/daily.js`). Deployment is described in `deploy/README.md` at the repository root.

## Rules

Every block obeys the same three, whether it was pushed or knocked:

1. It falls as many squares as it has dots.
2. It knocks over the first standing block it reaches, and that block falls the same way.
3. The edge or a fallen block stops it, and the line ends there.

Only amber blocks can be pushed. A push that lands straight on a sage block gets no arrow, because it could only lose;
a line can still reach a sage block further along. Fallen squares join up side by side or end to end, and a path can't
cross a sage block.

## How puzzles are made

- Boards are precomputed into `puzzles.js` by `scripts/build-puzzles.mjs`, using the rules from `index.html`.
- 6-8 amber and 4-6 sage blocks, heights 1-3, with flags at least two rows apart.
- People read the route at a glance, so a board that can be solved by laying one plank per push is easy however few
  ways there are to do it. A day is kept only when the interactions are mandatory: every par solution uses a line of
  two or more blocks, at most half the orderings of each solution work, there are at most four solutions, par is 4-6,
  and always closing the gap greedily misses par.
- About 1 random board in 100 qualifies, so a board takes seconds to find.
- `daily[i]` is the board for `epoch + i` days. `.github/workflows/puzzles.yml` appends new days weekly and never
  regenerates existing ones. Changing the rules or the filter affects only days added afterwards, unless you rebuild.

## History

The rules took several rounds of playtesting, and the dead ends are worth keeping:

- Letting a pushed block go only where it has room created the planning at first, but every fix for its side effects
  added an exception. Three plain rules replaced them all.
- "Topple every amber block" could always be finished, so it was too easy. The path goal lets you dead-end.
- Bots that failed the boards said nothing about people, who kept reaching par quickly. Requiring chains and ordering is
  what finally made a difference, so judge difficulty by playing it.
