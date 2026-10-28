// Generator check: runs the game's own rules from index.html (everything
// above the rendering section) over the next 60 daily suites plus 40 random
// ones. Each suite must fail something on CI's run, leave no dependency
// certain from that run, and be solved by the bot, whose runs must narrow the
// hypotheses to exactly the hidden dependencies. Prints how ambiguous the
// suites start out and what the bot needs.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { generate, bot, hypotheses, play, sameDiagnosis, unpack, FULL, K };', ctx);
const { generate, bot, hypotheses, play, sameDiagnosis, unpack, FULL, K } = ctx.api;

const seeds = [];
for (let d = 0; d < 60; d++) {
  const t = new Date(Date.UTC(2026, 9, 28 + d));
  seeds.push('flaky-' + t.toISOString().slice(0, 10));
}
for (let i = 0; i < 40; i++) seeds.push('practice-check-' + i);

const failures = [], stats = { b0: [], runs: [], cost: [], ms: [] };
for (const seed of seeds) {
  const t0 = Date.now();
  const P = generate(seed);
  if (!P.fail0) failures.push(`${seed}: CI run passes`);
  if (!P.B0.includes(P.truth)) failures.push(`${seed}: truth inconsistent with CI run`);
  const certain = unpack(P.truth).filter(a => P.B0.every(h => unpack(h).includes(a)));
  if (certain.length) failures.push(`${seed}: dependency certain from CI run`);
  const B = bot(P);
  stats.ms.push(Date.now() - t0);
  // Replay the bot's runs as a player and check they pin down the answer.
  const S = { runs: [{ run: FULL, fail: P.fail0 }], cost: 0 };
  B.steps.forEach(s => { if (play(P, S, s.run) !== s.fail) failures.push(`${seed}: bot saw a different result`); });
  const left = hypotheses(S.runs);
  if (left.length !== 1 || left[0] !== P.truth) failures.push(`${seed}: bot runs leave ${left.length} hypotheses`);
  if (S.cost !== B.cost) failures.push(`${seed}: bot cost ${B.cost} but replay costs ${S.cost}`);
  if (!sameDiagnosis(P, unpack(P.truth)) || sameDiagnosis(P, unpack(P.B0.find(h => h !== P.truth)))) failures.push(`${seed}: diagnosis check broken`);
  stats.b0.push(P.B0.length); stats.runs.push(B.steps.length); stats.cost.push(B.cost);
}

const q = xs => { const s = xs.slice().sort((a, b) => a - b); return `min ${s[0]} median ${s[s.length >> 1]} max ${s[s.length - 1]}`; };
console.log(`${seeds.length} suites, ${K} dependencies each`);
console.log(`hypotheses after CI run: ${q(stats.b0)}`);
console.log(`bot runs: ${q(stats.runs)}; bot CI seconds: ${q(stats.cost)}`);
console.log(`generate + bot ms: ${q(stats.ms)}`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('ok');
