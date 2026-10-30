// daily.js check: its RNG and shuffle must match the copy every existing game
// carries (Poise's is the reference), and its date helpers and store must behave.
// Node built-ins only.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const store = {};
const ctx = { localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } } };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../public/shared/daily.js', import.meta.url), 'utf8') + '\nthis.Daily = Daily;', ctx);
const { Daily } = ctx;

const poise = readFileSync(new URL('../../poise/index.html', import.meta.url), 'utf8');
const ref = {};
vm.createContext(ref);
vm.runInContext(poise.match(/function rng\(str\)[\s\S]*?\n}\nfunction shuffle[^\n]*\n/)[0] + 'this.api = { rng, shuffle };', ref);

for (const seed of ['poise-daily-2026-10-29', 'x', '', 'runoff-practice-0.5']) {
  const a = Daily.rng(seed), b = ref.api.rng(seed);
  for (let i = 0; i < 50; i++) assert.equal(a(), b(), `rng differs for "${seed}"`);
  assert.deepEqual([...Daily.shuffle(Daily.rng(seed), [1, 2, 3, 4, 5, 6])], [...ref.api.shuffle(ref.api.rng(seed), [1, 2, 3, 4, 5, 6])]);
}

assert.match(Daily.dateKey, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(Daily.number(Daily.dateKey), 1);
const yesterday = new Date(Date.now() - 864e5);
const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
assert.equal(Daily.number(yKey), 2);

const s = Daily.store('test1-');
assert.equal(s.load(), null);
s.save({ moves: 3 });
assert.deepEqual({ ...s.load() }, { moves: 3 });
assert.ok(store['test1-' + Daily.dateKey]);

assert.equal(Daily.fmtScore(0), 'E');
assert.equal(Daily.fmtScore(2), '+2');
assert.equal(Daily.fmtScore(-1), '−1');
console.log('daily.js: ok');
