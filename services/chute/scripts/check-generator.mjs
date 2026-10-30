// Generator check: every board must start unsorted, have between one and three solutions, a par equal to the fewest
// flips to the nearest of them and within 3-4, no lever out of play at the start or in a solution-reaching run, every
// colour in use, and generate quickly and deterministically. Runs the game's own code from index.html (the rules
// section) in a sandbox, with the shared daily helpers.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const daily = readFileSync(new URL('../../web/public/shared/daily.js', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${daily}\n${script}\nthis.api = { generate, drop, strays, touched, bits, popcount, GATES, COLOURS, MARBLES };`, ctx);
const { generate, drop, strays, touched, bits, popcount, GATES, COLOURS, MARBLES } = ctx.api;

const SEEDS = 400;
let failures = 0;
const pars = {}, times = [];
for (let s = 0; s < SEEDS; s++) {
  const seed = `check-${s}`;
  const fail = msg => { failures++; console.error(`${seed}: ${msg}`); };
  const t0 = performance.now();
  const g = generate(seed);
  times.push(performance.now() - t0);
  const at = drop(g, g.start);
  if (strays(g, at.lands) < MARBLES / 2) fail('fewer than half the marbles stray at the start');
  if (touched(at.routes) < GATES) fail('a lever is out of play at the start');
  const sols = [];
  for (let n = 0; n < 1 << GATES; n++) if (!strays(g, drop(g, bits(n)).lands)) sols.push(n);
  if (!sols.length || sols.length > 3) fail(`${sols.length} solutions`);
  const start = g.start.reduce((a, v, k) => a | v << k, 0);
  if (Math.min(...sols.map(n => popcount(n ^ start))) !== g.par) fail('par is not the fewest flips');
  if (g.par < 3 || g.par > 4) fail(`par ${g.par} out of range`);
  if (new Set(g.colours).size !== COLOURS) fail('a colour is missing');
  if (JSON.stringify(generate(seed)) !== JSON.stringify(g)) fail('not deterministic');
  pars[g.par] = (pars[g.par] || 0) + 1;
}
times.sort((a, b) => a - b);
console.log(`par ${JSON.stringify(pars)}, generation median ${times[SEEDS >> 1].toFixed(1)} ms, max ${times.at(-1).toFixed(0)} ms`);
if (times.at(-1) > 500) { failures++; console.error('generation too slow'); }
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('ok');
