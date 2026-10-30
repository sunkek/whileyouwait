// The generator, shared by build-puzzles.mjs and check-generator.mjs. It runs the game's own rules from index.html
// (everything above the rendering section) in a sandbox, so a board can't drift from what the page plays.
//
// Reading the route and laying one plank per push is easy, so a day is kept only when the interactions are
// mandatory: every par solution uses a line of two or more blocks, at most half the orderings of each solution
// work, a day has at most four solutions, and always closing the gap greedily misses par. About 1 random board in
// 100 qualifies, which is why boards are precomputed.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(read('../../web/public/shared/daily.js') + '\nthis.Daily = Daily;', ctx);
const rules = read('../index.html').split('<script>').at(-1).split('// ---------- rendering')[0];
vm.runInContext(rules + '\nthis.api = { N, pushes, push, initial, lost, won, gap, reach, encode, decode };', ctx);
export const T = ctx.api;
export const { rng } = ctx.Daily;
const { N, pushes, push, initial, lost, won, gap } = T;

// Exact fewest pushes, breadth first over the states that keep every sage block standing.
export function solve(blocks, cap = 6) {
  let frontier = [initial(blocks)];
  const seen = new Set();
  for (let depth = 1; depth <= cap; depth++) {
    const next = [];
    for (const st of frontier) for (const [b, d] of pushes(blocks, st)) {
      const n = push(blocks, st, b, d).st;
      if (lost(blocks, n)) continue;
      if (won(blocks, n)) return depth;
      const k = n.occ.join();
      if (!seen.has(k)) { seen.add(k); next.push(n); }
    }
    if (!next.length) return null;
    frontier = next;
  }
  return null;
}

// Pushes taken by a player who always picks the safe push that closes the gap most, or null if it dead-ends.
export function greedy(blocks) {
  let st = initial(blocks);
  for (let n = 0; n < 14; n++) {
    if (won(blocks, st)) return n;
    let best = null, least = Infinity;
    for (const [b, d] of pushes(blocks, st)) {
      const r = push(blocks, st, b, d).st, g = gap(blocks, r);
      if (!lost(blocks, r) && g < least) { least = g; best = r; }
    }
    if (!best) return null;
    st = best;
  }
  return null;
}

// Every par solution as a set of pushes, and whether it uses a line of two or more blocks. Stops past `limit`.
export function solutions(blocks, par, limit = 12) {
  const found = new Map(), dead = new Set();
  const go = (st, left, path, multi) => {
    const key = left + ':' + st.occ.join() + (multi ? 'm' : '');
    if (dead.has(key)) return false;
    let any = false;
    for (const [b, d] of pushes(blocks, st)) {
      const r = push(blocks, st, b, d);
      if (lost(blocks, r.st)) continue;
      const m = multi || r.chain.length > 1, p = [...path, [b, d]];
      if (won(blocks, r.st)) {
        if (left === 1) { const id = p.map(x => x.join(':')).sort().join(' '); found.set(id, { pushes: p, multi: m || !!found.get(id)?.multi }); any = true; }
      } else if (left > 1 && go(r.st, left - 1, p, m)) any = true;
      if (found.size > limit) return true;
    }
    if (!any) dead.add(key);
    return any;
  };
  go(initial(blocks), par, [], false);
  return [...found.values()];
}

const orderings = a => a.length < 2 ? [a] : a.flatMap((x, i) => orderings([...a.slice(0, i), ...a.slice(i + 1)]).map(r => [x, ...r]));
// The share of a solution's orderings that work.
export function orderShare(blocks, list) {
  const all = orderings(list);
  const works = o => {
    let st = initial(blocks);
    for (const [b, d] of o) {
      if (st.fallen[b] || !pushes(blocks, st).some(([x, y]) => x === b && y === d)) return false;
      st = push(blocks, st, b, d).st;
      if (lost(blocks, st)) return false;
    }
    return won(blocks, st);
  };
  return all.filter(works).length / all.length;
}

// Why a board fails the day filter, or null if it qualifies.
export function reject(blocks, par) {
  if (par === null || par < 4 || par > 6) return 'par';
  const sols = solutions(blocks, par);
  if (!sols.length || sols.length > 4) return 'solutions';
  if (!sols.every(s => s.multi)) return 'no chain needed';
  if (sols.some(s => orderShare(blocks, s.pushes) > 0.5)) return 'order free';
  const g = greedy(blocks);
  return g !== null && g <= par ? 'greedy' : null;
}

// One flag on each side at least two rows apart, on squares no block stands on.
export function generate(seed) {
  const R = rng(seed);
  for (;;) {
    const scarce = R() < 0.5, amber = (scarce ? 6 : 7) + Math.floor(R() * 2), sage = (scarce ? 5 : 4) + Math.floor(R() * 2), cells = [...Array(N * N).keys()];
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const blocks = cells.slice(0, amber + sage).map((c, i) => ({ x: c % N, y: Math.floor(c / N), h: 1 + Math.floor(R() * 3), sage: i >= amber }));
    const taken = new Set(blocks.map(k => k.y * N + k.x)), rows = [...Array(N).keys()];
    const left = rows.filter(y => !taken.has(y * N)), right = rows.filter(y => !taken.has(y * N + N - 1));
    if (!left.length || !right.length) continue;
    const y0 = left[Math.floor(R() * left.length)], y1 = right[Math.floor(R() * right.length)];
    if (Math.abs(y0 - y1) < 2) continue;
    blocks.ends = [y0 * N, y1 * N + N - 1];
    const par = solve(blocks);
    if (!reject(blocks, par)) return { blocks, par };
  }
}
