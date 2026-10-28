// Balance check: plays the daily-style shift with scripted players and
// asserts the difficulty band. A player who fixes the right root cause with
// human reaction time must usually meet the SLO; one who never acts must not.
// Runs the game's own code from index.html (everything above the rendering
// section) in a sandbox.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.split('<script>')[1].split('// ---------- rendering')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script + '\nthis.api = { newGame, step, act, uptime, BY, USERS };', ctx);
const { newGame, step, act, uptime, BY, USERS } = ctx.api;
const SLO = 0.8;

// How many user-facing services go down if this service fails on its own.
function impact(id) {
  const memo = {};
  const ok = x => x in memo ? memo[x] : (memo[x] = x !== id && BY[x].deps.every(ok));
  return USERS.filter(u => !ok(u.id)).length;
}

function play(seed, react) {
  const g = newGame(seed);
  while (!g.ended) {
    step(g, 0.05);
    if (g.work || react === null) continue;
    const ready = [...g.broken.keys()].filter(id => g.t - g.broken.get(id) >= react);
    if (ready.length) act(g, ready.sort((a, b) => impact(b) - impact(a))[0]);
  }
  return uptime(g);
}

const median = xs => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const seeds = Array.from({ length: 60 }, (_, i) => `check-${i}`);
const human = seeds.map(s => play(s, 0.9));
const idle = seeds.map(s => play(s, null));
const again = play(seeds[0], 0.9);

const failures = [];
if (median(human) < SLO) failures.push(`human-speed player median ${median(human)} is below the SLO`);
if (median(human) > 0.95) failures.push(`human-speed player median ${median(human)} is too easy`);
if (Math.max(...idle) >= SLO) failures.push('a player who never acts met the SLO');
if (again !== human[0]) failures.push('the same seed produced a different shift');

console.log(`human-speed median ${(median(human) * 100).toFixed(1)}%, idle max ${(Math.max(...idle) * 100).toFixed(1)}%`);
if (failures.length) { failures.forEach(f => console.error(f)); process.exit(1); }
console.log('ok');
