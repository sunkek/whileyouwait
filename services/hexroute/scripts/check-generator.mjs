// Generator check: every puzzle must be solvable from its constructed
// solution, start unsolved, and generate quickly. Runs the game's own code
// from index.html (everything above the rendering section) in a sandbox.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = { matchMedia: () => ({ matches: false }) };
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { generate, evaluate };', ctx);
const { generate, evaluate } = ctx.api;

const SEEDS = 40;
let failures = 0;
for (const level of ['small', 'medium', 'large']) {
  const t0 = performance.now();
  const pars = [];
  for (let s = 0; s < SEEDS; s++) {
    const seed = `check-${level}-${s}`;
    const g = generate(seed, level);
    if (evaluate(g.cells, g.nb).won) { failures++; console.error(`${seed}: starts solved`); }
    g.cells.forEach(c => { c.rot = 0; });
    const ev = evaluate(g.cells, g.nb);
    if (!ev.won) { failures++; console.error(`${seed}: solution does not solve (${ev.lit}/${ev.total} lit, ${ev.open} loose)`); }
    pars.push(g.par);
  }
  const ms = (performance.now() - t0) / SEEDS;
  console.log(`${level}: par ${Math.min(...pars)}-${Math.max(...pars)}, ${ms.toFixed(1)} ms/puzzle`);
  if (ms > 200) { failures++; console.error(`${level}: generation too slow`); }
}
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('ok');
