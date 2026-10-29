// track.js check: runs the analytics loader against a fake page and storage
// and asserts which "visit" event, if any, it would send. Node built-ins only.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src = readFileSync(new URL('../public/shared/track.js', import.meta.url), 'utf8');
const k = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ago = n => k(new Date(Date.now() - n * 864e5));
function run(keys, site = 'SITE') {
  const store = Object.fromEntries(keys.map(x => [x, '1']));
  const appended = []; let tracked = null;
  const ctx = {
    window: { WYW_SITE: site }, Date, Math,
    localStorage: { get length() { return Object.keys(store).length; }, key: i => Object.keys(store)[i] },
    document: { currentScript: { dataset: { game: 'flaky', save: 'flaky1-' } },
      createElement: () => ({ dataset: {} }), head: { appendChild: s => appended.push(s) } },
  };
  vm.runInNewContext(src, ctx);
  const s = appended[0];
  if (s && s.onload) { ctx.window.umami = { track: (n, d) => { tracked = [n, d]; } }; s.onload(); }
  return { loaded: !!s, id: s && s.dataset.websiteId, tracked: tracked && JSON.stringify(tracked) };
}
const cases = {
  'new player': run([]),
  'played yesterday + 3 days ago': run(['flaky1-' + ago(1), 'flaky1-' + ago(3), 'hexroute-' + ago(1), 'flaky1-junk']),
  'returns after 9 days': run(['flaky1-' + ago(9)]),
  'already played today': run(['flaky1-' + ago(0), 'flaky1-' + ago(2)]),
  'no site id': run([], ''),
};
const visit = (prior, gap) => JSON.stringify(['visit', { game: 'flaky', prior, gap }]);
assert.deepEqual(cases['new player'], { loaded: true, id: 'SITE', tracked: visit(0, 0) });
assert.deepEqual(cases['played yesterday + 3 days ago'], { loaded: true, id: 'SITE', tracked: visit(2, 1) });
assert.deepEqual(cases['returns after 9 days'], { loaded: true, id: 'SITE', tracked: visit(1, 9) });
assert.deepEqual(cases['already played today'], { loaded: true, id: 'SITE', tracked: null });
assert.deepEqual(cases['no site id'], { loaded: false, id: undefined, tracked: null });
console.log(`track.js: ${Object.keys(cases).length} cases ok`);
