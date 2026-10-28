// Puzzle check: generates incidents at every difficulty and verifies that
// the true fault set is among the hypotheses the player could hold, that the
// par strategy resolves the incident, that generation is deterministic, and
// that it is fast enough to run on page load. Runs the game's own code from
// index.html (everything above the rendering section) in a sandbox.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { generate, hypotheses, UNHEALTHY };', ctx);
const { generate, hypotheses, UNHEALTHY } = ctx.api;

const failures = [];
for (const k of [1, 2, 3]) {
  let slowest = 0;
  const pars = [];
  for (let i = 0; i < 30; i++) {
    const seed = `check-${k}-${i}`;
    const t0 = performance.now();
    const p = generate(seed, k);
    slowest = Math.max(slowest, performance.now() - t0);
    pars.push(p.par);
    const B = hypotheses(k, p.mon, UNHEALTHY[p.truth] & p.mon);
    if (!B.includes(p.truth)) failures.push(`${seed}: truth is not a hypothesis`);
    if (B.length !== p.suspects) failures.push(`${seed}: suspect count mismatch`);
    let h = p.truth;
    p.parSteps.forEach(a => { if (a.k === 'fix') h &= ~(1 << a.s); });
    if (h !== 0) failures.push(`${seed}: par strategy leaves faults unfixed`);
    if (generate(seed, k).par !== p.par) failures.push(`${seed}: not deterministic`);
  }
  console.log(`k=${k}: par ${Math.min(...pars)}-${Math.max(...pars)} user-min, slowest ${slowest.toFixed(0)} ms`);
  if (slowest > 1000) failures.push(`k=${k}: generation took ${slowest.toFixed(0)} ms`);
}
if (failures.length) { failures.forEach(f => console.error(f)); process.exit(1); }
console.log('ok');
