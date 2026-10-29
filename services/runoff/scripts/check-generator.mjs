// Generator check: every hillside's solved terrain must meet its goals, the start
// must differ from it only by shoves on movable squares and break at least three
// goals, par must be at least 3 and, when found by search, reachable in par shoves, the fast simulator
// must agree with the drawn one, and generation must be deterministic and quick.
// Runs the game's own code from index.html (the rules section) in a sandbox.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = { performance };
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { generate, simulate, wetSquares, unmet, locked, minShoves, N, MAXH };', ctx);
const { generate, simulate, wetSquares, unmet, locked, minShoves, N, MAXH } = ctx.api;

const SEEDS = 60;
let failures = 0;
const pars = [], times = [];
let guessed = 0;
for (let s = 0; s < SEEDS; s++) {
  const seed = `check-${s}`;
  const fail = msg => { failures++; console.error(`${seed}: ${msg}`); };
  const t0 = performance.now();
  const g = generate(seed);
  times.push(performance.now() - t0);
  const L = locked(g), sum = h => h.reduce((a, b) => a + b, 0);
  if (unmet(g, g.solution)) fail('solved terrain misses a goal');
  if (unmet(g, g.start) < 3) fail('start breaks fewer than three goals');
  if (sum(g.start) !== sum(g.solution)) fail('soil not conserved');
  if ([...L].some(i => g.start[i] !== g.solution[i])) fail('a locked square moved');
  if (g.start.some(v => v < 0 || v > MAXH)) fail('height out of range');
  if (new Set([g.spring, ...g.fields, ...g.houses]).size !== 7) fail('goals overlap');
  if (g.par < 3) fail(`par ${g.par} below 3`);
  // when the search gave up, par is the scramble's length, solvable by undoing it
  if (g.exact && minShoves(g, g.start, g.par) === null) fail(`no solution in par ${g.par} shoves`);
  for (const h of [g.start, g.solution]) {
    const a = simulate(h, g.spring).step, b = wetSquares(h, g.spring);
    for (let i = 0; i < N; i++) if ((a[i] >= 0) !== !!b[i]) { fail('fast simulator disagrees'); break; }
  }
  if (JSON.stringify(generate(seed)) !== JSON.stringify(g)) fail('not deterministic');
  pars.push(g.par); if (!g.exact) guessed++;
}
times.sort((a, b) => a - b);
const count = {}; for (const p of pars) count[p] = (count[p] || 0) + 1;
console.log(`par ${JSON.stringify(count)} (${guessed} from the scramble), generation median ${times[SEEDS >> 1].toFixed(0)} ms, max ${times.at(-1).toFixed(0)} ms`);
if (times[SEEDS >> 1] > 1000) { failures++; console.error('generation too slow'); }
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('ok');
