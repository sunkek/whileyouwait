// Analytics: loads the Umami tracker from this origin and, on a game page,
// sends one "visit" event with how often and how recently this browser played
// that game before. No cookie and no visitor ID: the history is read from the
// game's own dated saves, which it already keeps to restore progress.
//
// Runs synchronously from the game's <head>, before the game's own script, so
// the snapshot shows the saves as they were before this visit wrote today's.
// window.WYW_SITE comes from /shared/config.js (rendered by nginx from
// UMAMI_WEBSITE_ID); without it nothing is loaded or sent.
(() => {
  const me = document.currentScript;
  const game = me.dataset.game;
  const prefix = me.dataset.save;

  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = key(new Date());

  let visit = null;
  if (game && prefix) {
    const days = [];
    let counted = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const d = k && k.startsWith(prefix) ? k.slice(prefix.length) : '';
        if (d === today) counted = true;
        else if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d < today) days.push(d);
      }
    } catch (e) {}
    // A save for today means this day was already counted. Games save on the
    // first move, not on load, so reloads before any move repeat the event;
    // Umami's per-session counts absorb most of that.
    if (!counted) {
      const last = days.sort().at(-1);
      const gap = last ? Math.round((new Date(today) - new Date(last)) / 864e5) : 0;
      visit = { game, prior: Math.min(days.length, 30), gap: Math.min(gap, 30) };
    }
  }

  const site = window.WYW_SITE;
  if (!site) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = '/a/s.js';
  s.dataset.websiteId = site;
  if (visit) s.onload = () => window.umami && window.umami.track('visit', visit);
  document.head.appendChild(s);
})();
