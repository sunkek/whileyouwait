// Generator check: every puzzle must start unwoven, weave the target from its
// constructed setup, have a par equal to the forward taps that undo the
// scramble, use every tie-up, and generate quickly. Runs the game's own code
// from index.html (everything above the rendering section) in a sandbox.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { generate, weave, TIEUPS, N, S };', ctx);
const { generate, weave, TIEUPS, N, S } = ctx.api;

const SEEDS = 400;
const same = (a, b) => a.every((v, i) => v === b[i]);
let failures = 0;
const pars = [], starts = [], names = {};
const t0 = performance.now();
for (let s = 0; s < SEEDS; s++) {
  const seed = `check-${s}`;
  const g = generate(seed);
  if (same(weave(g.tie, g.t, g.u), g.target)) { failures++; console.error(`${seed}: starts woven`); }
  if (!same(weave(g.tie, g.solT, g.solU), g.target)) { failures++; console.error(`${seed}: solution does not weave the target`); }
  const undo = [...g.t.map((v, i) => (g.solT[i] - v + S) % S), ...g.u.map((v, i) => (g.solU[i] - v + S) % S)].reduce((a, b) => a + b, 0);
  if (undo !== g.par) { failures++; console.error(`${seed}: par ${g.par} but undoing takes ${undo}`); }
  if (JSON.stringify(generate(seed)) !== JSON.stringify(g)) { failures++; console.error(`${seed}: not deterministic`); }
  pars.push(g.par);
  starts.push(weave(g.tie, g.t, g.u).filter((v, i) => v === g.target[i]).length);
  names[g.name] = (names[g.name] || 0) + 1;
}
const ms = (performance.now() - t0) / SEEDS;
for (const name of Object.keys(TIEUPS)) if (!names[name]) { failures++; console.error(`tie-up never used: ${name}`); }
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
console.log(`par ${Math.min(...pars)}-${Math.max(...pars)} (median ${med(pars)}), start ${med(starts)}/${N * N} cells right, ${ms.toFixed(2)} ms/puzzle`);
console.log(`tie-ups: ${Object.entries(names).map(([k, v]) => `${k} ${v}`).join(', ')}`);
if (ms > 50) { failures++; console.error('generation too slow'); }
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('ok');
