// Checks Timber's rules and puzzles.js. Every block in every push of random play must fall as far as its height
// unless it stops at the next block in the line, the edge or a fallen block, and no push may land straight on sage.
// Then a sample of stored days must qualify under the day filter, and the list must run far enough ahead.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { T, solve, reject, rng } from './generator.mjs';

const { N, pushes, push, initial, lost, won, decode } = T;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../puzzles.js', import.meta.url), 'utf8') + '\nthis.P = PUZZLES;', ctx);
const { epoch, daily, practice } = ctx.P;

let failures = 0, moves = 0;
const fail = msg => { failures++; console.error(msg); };
const boards = [...daily, ...practice].map(decode);
boards.forEach((g, n) => {
  const { blocks: b } = g, R = rng('check-' + n);
  const cells = b.map(k => k.y * N + k.x);
  if (new Set(cells).size !== cells.length) fail(`board ${n}: blocks overlap`);
  if (b.ends.some(c => cells.includes(c))) fail(`board ${n}: a block stands on a flag`);
  if (b.ends[0] % N !== 0 || b.ends[1] % N !== N - 1) fail(`board ${n}: flags are not on opposite sides`);
  for (let game = 0; game < 4; game++) {
    let st = initial(b);
    while (!won(b, st) && !lost(b, st)) {
      const m = pushes(b, st);
      if (!m.length) break;
      const [i, d] = m[Math.floor(R() * m.length)], r = push(b, st, i, d);
      moves++;
      if (r.chain.length > 1 && b[r.chain[1].id].sage) fail(`board ${n}: a push landed straight on sage`);
      r.chain.forEach((e, j) => {
        const k = b[e.id], free = e.cells.length - 1, x = k.x + DIRS[d][0] * (free + 1), y = k.y + DIRS[d][1] * (free + 1);
        if (free > k.h) fail(`board ${n}: a block fell too far`);
        if (j < r.chain.length - 1) { if (b[r.chain[j + 1].id].x !== x || b[r.chain[j + 1].id].y !== y) fail(`board ${n}: a line skipped a block`); }
        else if (free < k.h && x >= 0 && y >= 0 && x < N && y < N && st.occ[y * N + x] < 0) fail(`board ${n}: a block stopped in open space`);
      });
      st = r.st;
    }
  }
});

// The full filter is slow, so it runs on a sample spread over both lists.
const pars = {};
const sample = boards.filter((_, i) => i % Math.ceil(boards.length / 30) === 0);
sample.forEach((g, n) => {
  const par = solve(g.blocks);
  if (par !== g.par) fail(`sample ${n}: stored par ${g.par}, solved ${par}`);
  const why = reject(g.blocks, par);
  if (why) fail(`sample ${n}: fails the day filter: ${why}`);
});
boards.forEach(g => { pars[g.par] = (pars[g.par] || 0) + 1; });

const ahead = Math.round((Date.parse(epoch) + (daily.length - 1) * 864e5 - Date.now()) / 864e5);
if (ahead < 60) fail(`daily boards run out in ${ahead} days`);
if (!practice.length) fail('no practice boards');
console.log(`${daily.length} daily from ${epoch}, ${ahead} days ahead, ${practice.length} practice, par ${JSON.stringify(pars)}, ${moves} random pushes, ${sample.length} sampled`);
if (failures) process.exit(1);
console.log('ok');
