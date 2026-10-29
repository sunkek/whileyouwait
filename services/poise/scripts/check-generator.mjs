// Generator check: every mobile must hang level in exactly one arrangement, start
// at least 6 swaps away with at most one bar level, have a par equal to the
// fewest swaps, fit the width limit, and generate quickly and deterministically.
// Runs the game's own code from index.html (the rules section) in a sandbox.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { generate, balanced, bars, torque, countSolutions, minSwaps, extent, MAX_WIDTH };', ctx);
const { generate, balanced, bars, torque, countSolutions, minSwaps, extent, MAX_WIDTH } = ctx.api;

const SEEDS = 300;
let failures = 0;
const pars = [], hooks = [], widths = [];
const t0 = performance.now();
for (let s = 0; s < SEEDS; s++) {
  const seed = `check-${s}`;
  const g = generate(seed);
  const fail = msg => { failures++; console.error(`${seed}: ${msg}`); };
  if (!balanced(g.tree, g.solution)) fail('solution is not level');
  if (countSolutions(g.tree, g.values, 3) !== 1) fail('not exactly one level arrangement');
  if (g.solution.slice().sort((a, b) => a - b).join() !== g.values.join() || g.start.slice().sort((a, b) => a - b).join() !== g.values.join()) fail('weights differ between start and solution');
  if (new Set(g.values).size !== g.values.length) fail('weights repeat');
  if (minSwaps(g.start, g.solution) !== g.par || g.par < 6) fail(`par ${g.par} wrong or too small`);
  if (bars(g.tree).filter(b => torque(b, g.start) === 0).length > 1) fail('more than one bar starts level');
  const box = extent(g.tree);
  if (box.left + box.right > MAX_WIDTH) fail('too wide');
  if (JSON.stringify(generate(seed)) !== JSON.stringify(g)) fail('not deterministic');
  pars.push(g.par); hooks.push(g.values.length); widths.push(box.left + box.right);
}
const ms = (performance.now() - t0) / SEEDS / 2; // each seed generates twice
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
console.log(`par ${Math.min(...pars)}-${Math.max(...pars)} (median ${med(pars)}), ${Math.min(...hooks)}-${Math.max(...hooks)} weights, width median ${Math.round(med(widths))}, ${ms.toFixed(1)} ms/mobile`);
if (ms > 150) { failures++; console.error('generation too slow'); }
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('ok');
