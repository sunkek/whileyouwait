// stats.js check: the first result of a day stands, par credit and runs count correctly, favorites and ratings
// persist, and every game's page reports its result. Node built-ins only.
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../public/shared/stats.js', import.meta.url), 'utf8');
function load(store = {}, RealDate = Date) {
  const ctx = { Date: RealDate, JSON, Object, Math, Set, String, Number, window: {},
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } }, document: { getElementById: () => null } };
  vm.createContext(ctx);
  vm.runInContext(src + '\nthis.Stats = Stats;', ctx);
  return ctx.Stats;
}
const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return key(d); };

const store = {};
let S = load(store);
S.finish('poise', true, 2);
S.finish('poise', true, 0);          // a second result today doesn't replace the first
S.finish('poise', false, 0);         // practice isn't recorded
S.finish('flaky', true, null);       // finished with no par credit
let g = S.summary();
const poise = g.games.find(x => x.id === 'poise'), flaky = g.games.find(x => x.id === 'flaky');
assert.equal(poise.played, 1); assert.equal(poise.best, 2); assert.equal(poise.atPar, 0);
assert.equal(flaky.played, 1); assert.equal(flaky.best, null);
assert.equal(g.finished, 2); assert.equal(g.days, 1); assert.equal(g.run, 1);

const runs = (days) => { const results = { poise: Object.fromEntries(days.map(n => [ago(n), 0])) }; return load({ 'wyw-stats': JSON.stringify({ results }) }).summary(); };
assert.equal(runs([0, 1, 2]).run, 3);
assert.equal(runs([1, 2]).run, 2, 'a run survives until the day after');
assert.equal(runs([2, 3]).run, 0, 'a missed day ends it');
assert.equal(runs([2, 3]).bestRun, 2);
assert.equal(runs([0, 2, 3, 4]).bestRun, 3);
assert.equal(runs([0, 2, 3, 4]).run, 1);

S = load(store);
assert.equal(S.bar(4, 4, '🟦'), '🟦🟦🟦🟦');
assert.equal(S.bar(6, 4, '🟦'), '🟦🟦🟦🟦🟥🟥');
assert.equal(S.bar(40, 40, '🟩'), '🟩'.repeat(10), 'long games scale to ten squares');
assert.equal(S.bar(41, 40, '🟩'), '🟩'.repeat(10) + '🟥', 'a move over par always shows');
assert.equal(S.bar(400, 40, '🟩'), '🟩'.repeat(10) + '🟥'.repeat(10), 'red is capped');
assert.equal(S.toggleFavorite('loom'), true);
assert.deepEqual([...S.favorites()], ['loom']);
assert.equal(S.toggleFavorite('loom'), false);
assert.equal(load({ 'wyw-stats': '{broken' }).summary().finished, 0, 'a corrupt record reads as empty');

// Every game listed here must exist and report its result; every game directory must be listed.
const dirs = readdirSync(new URL('../../', import.meta.url), { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== 'web').map(d => d.name);
assert.deepEqual(Array.from(S.GAMES, x => x.id).sort(), dirs.sort());
for (const g of dirs) {
  const page = readFileSync(new URL(`../../${g}/index.html`, import.meta.url), 'utf8');
  const head = readFileSync(new URL(`../../${g}/head.html`, import.meta.url), 'utf8');
  assert.ok(page.includes(`Stats.finish('${g}'`), `${g} doesn't call Stats.finish`);
  assert.ok(head.includes('/shared/stats.js'), `${g}/head.html doesn't load stats.js`);
}
console.log('stats.js: ok');
