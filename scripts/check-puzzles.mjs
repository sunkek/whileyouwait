// Puzzle check: validates every precomputed incident in puzzles.js against
// the game's own rules from index.html (everything above the rendering
// section): the faults explain the alerts, no fault is certain from the first
// alerts, the par strategy reads logs at least twice, fixes every fault, and
// costs exactly the stored par, played
// through the same action code the page uses. Regenerate with scripts/build-puzzles.mjs.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const store = readFileSync(new URL('../puzzles.js', import.meta.url), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(store + script + '\nthis.api = { PUZZLES, hypotheses, UNHEALTHY, popcount, outcome, newPlay, play };', ctx);
const { PUZZLES, hypotheses, UNHEALTHY, popcount, outcome, newPlay, play } = ctx.api;

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
    // Play par through the page's own action code, and check every log read
    // against the solver's model of what a check reveals.
    const st = newPlay(truth);
    let F = 0;
    for (const a of acts) {
      const expect = outcome(truth, F, a, mon).split(':')[0];
      const got = play(st, a);
      if (got !== expect) failures.push(`${id}: ${a.k} ${a.s} showed ${got}, solver expected ${expect}`);
      if (a.k === 'fix') F |= 1 << a.s;
    }
    if (st.h !== 0) failures.push(`${id}: par strategy leaves faults unfixed`);
    if (st.down !== par) failures.push(`${id}: par strategy costs ${st.down}, stored ${par}`);
    if (st.checks && !acts.some(a => a.k === 'check' && ['own', 'upstream', 'clean'].includes(outcome(truth, 0, a, mon)))) failures.push(`${id}: checks never read logs`);
  });
}
console.log(`${n} incidents checked, ${PUZZLES.daily.length} daily from ${PUZZLES.epoch}`);
if (failures.length) { failures.slice(0, 20).forEach(f => console.error(f)); process.exit(1); }
console.log('ok');
