// Shared helpers for new games: today's date key and number, the seeded RNG,
// per-day saves, score formatting and the share button. Load it with
// <script src="/shared/daily.js"></script> in the game's head.html.
//
// The six games that predate this file keep their own copies on purpose: they
// match this code, but switching them over is a chance to change every past and
// future daily puzzle for nothing.
const Daily = (() => {
  const pad = n => String(n).padStart(2, '0');
  const today = new Date();
  // Local date, so a daily changes at the player's midnight.
  const dateKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // The daily's number, counting the launch date ('YYYY-MM-DD') as #1.
  function number(launch) {
    const [y, m, d] = launch.split('-').map(Number);
    return Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, m - 1, d)) / 864e5) + 1;
  }

  // FNV-1a hash of the seed string into mulberry32; returns a function giving floats in [0, 1).
  function rng(str) {
    let seed = [...str].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(R, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Today's save under `prefix`, which track.js and the catalog read too (see CONTEXT.md, Save).
  // Save after every move: a wait can end at any moment.
  function store(prefix) {
    const key = prefix + dateKey;
    return {
      load() { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } },
      save(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} },
    };
  }

  // Score against par: E at par, +n over, −n under.
  const fmtScore = d => d === 0 ? 'E' : (d > 0 ? '+' : '−') + Math.abs(d);

  // Copies the share text from a textarea; selects it for a manual copy when the clipboard is unavailable.
  function copyButton(btn, ta) {
    const label = btn.textContent;
    btn.onclick = () => {
      const fallback = () => { ta.focus(); ta.select(); btn.textContent = 'Selected. Copy it manually'; };
      try {
        navigator.clipboard.writeText(ta.value).then(() => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = label, 1500); }, fallback);
      } catch (err) { fallback(); }
    };
  }

  return { dateKey, number, rng, shuffle, store, fmtScore, copyButton };
})();
