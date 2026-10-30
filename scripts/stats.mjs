// The report behind `make stats`, from Umami's API. Run it through scripts/stats.sh, which supplies the tunnel and
// the password on stdin. Read-only. `node scripts/stats.mjs [days]` limits it to the last n days; the default is
// everything since launch.
import { readFileSync } from 'node:fs';

const API = process.env.STATS_URL + '/api', LAUNCH = Date.parse('2026-10-29T00:00:00Z');
const days = Number(process.argv[2]) || 0;
const window = `startAt=${days ? Date.now() - days * 864e5 : LAUNCH}&endAt=${Date.now()}`;

const login = await fetch(API + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: process.env.STATS_USER || 'admin', password: readFileSync(0, 'utf8').trimEnd() }) });
if (!login.ok) { console.error(`login failed: ${login.status}`); process.exit(1); }
const { token } = await login.json();
const get = async path => {
  const r = await fetch(API + path, { headers: { authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
};

const { data: sites } = await get('/websites');
const site = sites.find(s => s.domain === 'whileyouwait.suncake.xyz');
const base = `/websites/${site.id}`;
const values = (event, prop) => get(`${base}/event-data/values?event=${event}&propertyName=${prop}&${window}`);
const heading = t => console.log(`\n${t}`);
// The collect endpoint is public, so anyone can send any string as a referrer, a browser or an event value.
// Control characters are stripped before printing, or such a string could drive the terminal.
const clean = v => String(v ?? '–').replace(/[\x00-\x1f\x7f-\x9f]/g, '?');
const row = (...cells) => console.log('  ' + cells.map((c, i) => clean(c)[i ? 'padStart' : 'padEnd'](i ? 7 : 22)).join(''));

const stats = await get(`${base}/stats?${window}`);
console.log(`WhileYouWait, ${days ? `last ${days} days` : 'since launch'}`);
console.log(`  ${stats.visitors} visitors, ${stats.visits} visits, ${stats.pageviews} page views, ${stats.bounces} bounced`);

// Umami has no stable visitor across devices, so sessions are what's left to read. One page view from a data-centre
// country is usually a bot or a link preview, and those are counted rather than listed.
const { data: sessions } = await get(`${base}/sessions?${window}&pageSize=200`);
const engaged = sessions.filter(s => s.views > 1);
heading(`Sessions with more than one page view: ${engaged.length} (${sessions.length - engaged.length} single-view hidden)`);
row('Country, device', 'Visits', 'Views', 'First', 'Last');
for (const s of engaged.sort((a, b) => b.views - a.views)) row(`${s.country} ${s.device} ${s.browser}`, s.visits, s.views, s.firstAt.slice(5, 10), s.lastAt.slice(5, 10));

heading('Game days played, and returns');
const visits = await values('visit', 'game'), prior = await values('visit', 'prior'), gap = await values('visit', 'gap');
const total = list => list.reduce((n, v) => n + v.total, 0);
for (const v of visits) row(v.value, v.total);
const returned = total(prior.filter(v => +v.value > 0)), week = total(gap.filter(v => +v.value >= 7));
console.log(`  ${returned} of ${total(visits)} came from a browser that had played that game before; ${week} after 7+ days away.`);
console.log('  Your own play counts here too.');

heading('Ratings (every press counts, including changed votes)');
const rated = await values('rate', 'game'), votes = await values('rate', 'value');
for (const v of rated) row(v.value, v.total);
const count = value => votes.find(v => v.value === value)?.total ?? 0;
console.log(`  ${count('1')} yes, ${count('-1')} no`);

heading('Where from');
const metric = type => get(`${base}/metrics?type=${type}&${window}&limit=10`);
const list = items => items.map(m => `${clean(m.x)} ${clean(m.y)}`).join(', ');
console.log('  ' + list(await metric('country')));
console.log('  ' + list(await metric('device')));
console.log('  referrers: ' + (list(await metric('referrer')) || 'none recorded'));
