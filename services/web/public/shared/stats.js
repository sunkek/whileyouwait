// The player's own record, kept in this browser only: daily results, favorites and ratings. No account, no cookie and
// no visitor ID. A rating also goes to the analytics as an anonymous event, which is how a game's ratings get counted.
//
// A game calls Stats.finish once its result and share text are on screen; it may call it again, because the first
// result of a day stands. Add a new game to GAMES, or the stats page won't list it. Share texts are built with bar and
// link below: they show how a run went without giving the day's answer away.
const Stats = (() => {
  const KEY = 'wyw-stats';
  const GAMES = [['timber', 'Timber'], ['runoff', 'Runoff'], ['poise', 'Poise'], ['loom', 'Loom'],
    ['root-cause', 'Root Cause'], ['flaky', 'Flaky'], ['hexroute', 'Hexroute']].map(([id, name]) => ({ id, name }));

  function read() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    return { results: {}, ratings: {}, favorites: [], ...s };
  }
  function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nextDay = key => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + 1)); };

  // A run against par as a row of squares, one per move, and red past par. Long games scale so par is ten squares.
  function bar(used, par, mark) {
    const scale = par > 12 ? 10 / par : 1, within = Math.max(1, Math.round(Math.min(used, par) * scale));
    return mark.repeat(within) + '🟥'.repeat(Math.min(10, Math.ceil(Math.max(0, used - par) * scale)));
  }
  // The address that goes in a share text. The ref shows in the analytics how many visits shares bring.
  const link = game => `${location.origin}/${game}/?ref=share`;

  // Record today's daily: score is the result against par (0 at par), or null when it earned no par credit.
  // Then fit the share box to its text and offer sharing and the rating, on practice boards too.
  function finish(game, daily, score) {
    if (daily) {
      const s = read(), days = s.results[game] = s.results[game] || {}, today = dayKey(new Date());
      if (!(today in days)) { days[today] = score; write(s); }
    }
    const text = document.getElementById('r-share');
    if (text) text.rows = text.value.split('\n').length;
    offerShare(text);
    offerRating(game);
  }

  // Phones have a share sheet, which is one tap instead of a copy and a paste. Closing it counts as a rejection, so
  // that's ignored.
  function offerShare(text) {
    const copy = document.getElementById('copy');
    if (!text || !copy || !navigator.share || document.getElementById('share')) return;
    const b = document.createElement('button');
    b.id = 'share';
    b.className = 'btn primary';
    b.textContent = 'Share';
    b.onclick = () => navigator.share({ text: text.value }).catch(() => {});
    copy.classList.remove('primary');
    copy.before(b);
  }

  function rate(game, value) {
    const s = read();
    s.ratings[game] = value;
    write(s);
    if (window.umami) window.umami.track('rate', { game, value });
  }

  function offerRating(game) {
    const box = document.getElementById('result');
    if (!box || box.querySelector('.rate')) return;
    const row = document.createElement('div'), label = document.createElement('span');
    row.className = 'controls rate';
    label.className = 'note';
    label.textContent = 'Did you like this game?';
    row.append(label);
    const buttons = [[1, 'Yes'], [-1, 'Not really']].map(([value, text]) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = text;
      b.setAttribute('aria-pressed', read().ratings[game] === value);
      b.onclick = () => { rate(game, value); buttons.forEach(x => x.setAttribute('aria-pressed', x === b)); };
      row.append(b);
      return b;
    });
    box.append(row);
  }

  const favorites = () => read().favorites;
  // Toggles a favorite and returns whether the game is now one.
  function toggleFavorite(game) {
    const s = read(), on = !s.favorites.includes(game);
    s.favorites = on ? [...s.favorites, game] : s.favorites.filter(g => g !== game);
    write(s);
    return on;
  }

  // Everything the stats page shows. A run is consecutive days with at least one finished daily; the current run
  // survives until the end of the day after the last one played.
  function summary(now = new Date()) {
    const s = read(), played = new Set();
    const games = GAMES.map(({ id, name }) => {
      const days = s.results[id] || {}, scores = Object.values(days), counted = scores.filter(v => v !== null);
      Object.keys(days).forEach(d => played.add(d));
      return { id, name, played: scores.length, atPar: counted.filter(v => v <= 0).length,
        best: counted.length ? Math.min(...counted) : null, rating: s.ratings[id] ?? null, favorite: s.favorites.includes(id) };
    });
    const days = [...played].sort();
    let best = 0, run = 0;
    days.forEach((d, i) => { run = i && nextDay(days[i - 1]) === d ? run + 1 : 1; best = Math.max(best, run); });
    const today = dayKey(now), last = days.at(-1), alive = last === today || (last && nextDay(last) === today);
    const finished = games.reduce((n, g) => n + g.played, 0), atPar = games.reduce((n, g) => n + g.atPar, 0);
    return { games, days: days.length, finished, atPar, run: alive ? run : 0, bestRun: best };
  }

  return { GAMES, finish, bar, link, favorites, toggleFavorite, summary };
})();
