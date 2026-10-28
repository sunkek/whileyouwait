// Puzzle check: validates every precomputed incident in puzzles.js against
// the game's own rules from index.html (everything above the rendering
// section): the faults explain the alerts, no fault is certain from the first
// alerts, the par strategy reads logs at least twice, fixes every fault, and
// costs exactly the stored par. Regenerate with scripts/build-puzzles.mjs.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const store = readFileSync(new URL('../puzzles.js', import.meta.url), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(store + script + '\nthis.api = { PUZZLES, hypotheses, UNHEALTHY, usersDown, duration, popcount };', ctx);
const { PUZZLES, hypotheses, UNHEALTHY, usersDown, duration, popcount } = ctx.api;

const failures = [];
let n = 0;
for (const kind of ['daily', 'practice']) {
  PUZZLES[kind].forEach(([k, mon, truth, par, steps], i) => {
    n++;
    const id = `${kind} ${i}`;
    if (popcount(truth) !== k) failures.push(`${id}: root count does not match the faults`);
    const B = hypotheses(mon, UNHEALTHY[truth] & mon);
    if (!B.includes(truth)) failures.push(`${id}: faults do not explain the alerts`);
    if (B.reduce((x, h) => x & h, -1) !== 0) failures.push(`${id}: a fault is certain from the first alerts`);
    const acts = steps.split(' ').map(x => ({ k: x[0] === 'c' ? 'check' : 'fix', s: +x.slice(1) }));
    if (acts.filter(a => a.k === 'check').length < 2) failures.push(`${id}: par needs fewer than two checks`);
    let h = truth, cost = 0;
    for (const a of acts) { cost += duration(a) * usersDown(h); if (a.k === 'fix') h &= ~(1 << a.s); }
    if (h !== 0) failures.push(`${id}: par strategy leaves faults unfixed`);
    if (cost !== par) failures.push(`${id}: par strategy costs ${cost}, stored ${par}`);
  });
}
console.log(`${n} incidents checked, ${PUZZLES.daily.length} daily from ${PUZZLES.epoch}`);
if (failures.length) { failures.slice(0, 20).forEach(f => console.error(f)); process.exit(1); }
console.log('ok');
