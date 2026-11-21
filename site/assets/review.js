// Review page: lists what the source collector found and lets a reviewer mark each item useful or skip, one tap each.
// Every server value is inserted with textContent or as an attribute, never as HTML.
const root = document.getElementById('rv');
const S = JSON.parse(root.dataset.strings || '{}');
const ICONS = JSON.parse(root.dataset.icons || '{}');
const $ = (id) => document.getElementById(id);
const PAGE = 20;
let status = 'new';
let items = [];

const fail = (msg = S.revFail) => { $('rv-err').textContent = msg; $('rv-err').hidden = false; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const iconBtn = (icon, label, cls = 'ibtn') => { const b = el('button', cls); b.type = 'button'; b.innerHTML = ICONS[icon] ?? ''; b.append(el('span', null, label)); b.title = label; return b; };
// Cloudflare Access sits in front of /review/ and /v1/review/: when its session ends, API calls get a redirect to its
// login page. A reload sends the whole page through that login and back.
async function api(path, init = {}) {
  const r = await fetch(path, { credentials: 'same-origin', redirect: 'manual', ...init }).catch(() => null);
  if (r && (r.type === 'opaqueredirect' || (r.status >= 300 && r.status < 400))) { location.reload(); return null; }
  return r;
}
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

async function load(more = false) {
  const before = more && items.length ? items[items.length - 1].id : null;
  const q = new URLSearchParams({ status, limit: String(PAGE), ...(before ? { before: String(before) } : {}) });
  const r = await api(`/v1/review/items?${q}`);
  if (!r) return fail();
  if (r.status === 401) { $('rv-out').hidden = false; $('rv-in').hidden = true; return; }
  if (r.status === 403) return fail(S.revNotReviewer);
  if (r.status === 503) return fail(S.revSetup);
  if (!r.ok) return fail();
  const body = await r.json();
  $('rv-err').hidden = true; $('rv-out').hidden = true; $('rv-in').hidden = false;
  for (const [k, n] of Object.entries(body.counts)) { const c = root.querySelector(`[data-count="${k}"]`); if (c) c.textContent = String(n); }
  items = more ? items.concat(body.items) : body.items;
  if (!more) $('rv-list').replaceChildren();
  for (const it of body.items) $('rv-list').append(card(it));
  $('rv-empty').hidden = items.length > 0;
  $('rv-more').hidden = body.items.length < PAGE;
}

function card(it) {
  const li = el('li', 'rv-item');
  const meta = el('p', 'rv-meta');
  meta.textContent = [it.source, (it.published_at ?? it.collected_at ?? '').slice(0, 10), `${S.revScore} ${it.score}`].filter(Boolean).join(' · ');
  const title = el('a', 'rv-title', it.title);
  title.href = it.url; title.target = '_blank'; title.rel = 'noopener noreferrer';
  li.append(meta, title);
  if (it.text) {
    const text = el('p', 'rv-text clamp', it.text);
    li.append(text);
    if (it.text.length > 280) {
      const toggle = el('button', 'rv-toggle', S.revMore);
      toggle.type = 'button';
      toggle.addEventListener('click', () => { const open = text.classList.toggle('clamp'); toggle.textContent = open ? S.revMore : S.revLess; });
      li.append(toggle);
    }
  }
  if (it.note) li.append(el('p', 'small', it.note));
  const actions = el('div', 'rv-actions');
  const open = el('a', 'ibtn');
  open.href = it.url; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.title = `${S.revOpen} (${host(it.url)})`;
  open.innerHTML = ICONS.external ?? ''; open.append(el('span', 'sr', S.revOpen));
  if (status === 'new') {
    const yes = iconBtn('check', S.revUseful, 'ibtn rv-yes'); yes.addEventListener('click', () => mark(it, 'useful', li));
    const no = iconBtn('skip', S.revSkip); no.addEventListener('click', () => mark(it, 'skip', li));
    actions.append(yes, no, open);
  } else {
    const back = iconBtn('replace', S.revBack); back.addEventListener('click', () => mark(it, 'new', li));
    actions.append(back, open);
  }
  li.append(actions);
  return li;
}

async function mark(it, next, li) {
  li.classList.add('busy');
  const r = await api(`/v1/review/items/${it.id}`, { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'scamdb' }, body: JSON.stringify({ status: next }) });
  if (!r?.ok) { li.classList.remove('busy'); return fail(); }
  li.remove();
  items = items.filter((x) => x.id !== it.id);
  for (const [k, d] of [[status, -1], [next, 1]]) { const c = root.querySelector(`[data-count="${k}"]`); if (c) c.textContent = String(Math.max(0, Number(c.textContent) + d)); }
  $('rv-empty').hidden = items.length > 0;
}

function select(next) {
  status = next;
  for (const b of root.querySelectorAll('.rv-tab[data-status]')) b.setAttribute('aria-selected', String(b.dataset.status === status));
  load();
}
for (const b of root.querySelectorAll('.rv-tab[data-status]')) b.addEventListener('click', () => select(b.dataset.status));
$('rv-more').addEventListener('click', () => load(true));

// ---- Sources and Runs tabs ----
let runs = null, registry = null, filter = 'all';
const day = (iso) => { try { return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
const resultText = (r) => (r.ok ? `${r.kept} ${S.revOfKept} ${r.total} ${S.revKept}` : r.error || S.revRunFailed);

async function loadRuns() {
  if (runs) return runs;
  const r = await api('/v1/review/runs');
  if (!r) return null;
  if (r.status === 401) { $('rv-out').hidden = false; $('rv-in').hidden = true; return null; }
  if (!r.ok) { fail(r.status === 503 ? S.revSetup : S.revFail); return null; }
  runs = (await r.json()).runs;
  return runs;
}
async function loadRegistry() {
  if (registry) return registry;
  const r = await api('/review/sources.json');
  if (!r?.ok) { fail(); return null; }
  registry = await r.json();
  return registry;
}
/** The newest result each source had, from the runs (newest first). */
function lastResults(list) {
  const out = {};
  for (const run of list) for (const x of run.sources) if (!out[x.id]) out[x.id] = { ...x, at: run.received_at };
  return out;
}

// Switches flipped on this page (GET /v1/review/sources) override the registry's default; null until loaded.
let switches = null;
async function loadSwitches() {
  if (switches) return switches;
  const r = await api('/v1/review/sources');
  if (!r?.ok) { switches = { map: new Map(), switchable: false }; return switches; }
  const body = await r.json();
  switches = { map: new Map(body.settings.map((x) => [x.id, x])), switchable: body.switchable };
  return switches;
}
const isOn = (x) => (switches?.map.has(x.id) ? switches.map.get(x.id).allowed : x.allowed);
// The same rule as the Worker's cannotRun: nothing to read, or a list of firms that never goes to the review queue.
const NEVER_ON = ['blacklist', 'registry', 'reporting', 'statistics'];
const cannotRun = (x) => (!x.feed ? S.revNoFeedReason : NEVER_ON.includes(x.use) ? S.revNeverOnReason : null);

async function showSources() {
  const [reg, list] = await Promise.all([loadRegistry(), loadRuns(), loadSwitches()]);
  if (!reg || !list) return;
  const last = lastResults(list);
  const on = reg.sources.filter(isOn);
  $('rv-src-sum').textContent = [`${on.length} ${S.revOn.toLowerCase()}`, `${reg.sources.length - on.length} ${S.revOff.toLowerCase()}`,
    list[0] ? `${S.revLastRun}: ${day(list[0].received_at)}` : S.revNoRuns].join(' · ');
  const keep = (x) => filter === 'all' || (filter === 'on' && isOn(x)) || (filter === 'off' && !isOn(x)) || (filter === 'failing' && last[x.id] && !last[x.id].ok);
  const shown = reg.sources.filter(keep);
  const box = $('rv-src-list');
  box.replaceChildren();
  if (filter === 'failing' && !shown.length) { box.append(el('p', 'small', S.revNoneFailing)); return; }
  // Countries A to Z; in each, the sources that are on first, then the others, each A to Z.
  const byCountry = new Map();
  for (const x of shown) byCountry.set(x.country, [...(byCountry.get(x.country) ?? []), x]);
  const name = (cc) => reg.countries[cc] ?? cc.toUpperCase();
  for (const cc of [...byCountry.keys()].sort((a, b) => name(a).localeCompare(name(b)))) {
    const group = byCountry.get(cc).sort((a, b) => Number(isOn(b)) - Number(isOn(a)) || a.name.localeCompare(b.name));
    box.append(el('h2', 'rv-h', `${name(cc)} · ${group.filter(isOn).length} ${S.revOn.toLowerCase()}`));
    const ul = el('ul', 'rv-src-list');
    for (const x of group) ul.append(isOn(x) ? sourceCard(x, last[x.id]) : sourceLine(x, last[x.id]));
    box.append(ul);
  }
}
const meta = (x) => [x.use, x.kind, x.lang, x.runs === 'home' ? S.revHomeOnly : null, x.feed ? null : S.revNoFeed].filter(Boolean).join(' · ');
function result(r, fallback) {
  const p = el('p', `rv-res ${r ? (r.ok ? 'is-ok' : 'is-fail') : 'is-none'}`, r ? resultText(r) : fallback);
  if (r) p.title = day(r.at);
  return p;
}
function siteLink(x) {
  const a = el('a', 'rv-site', S.revSite);
  a.href = x.site; a.target = '_blank'; a.rel = 'noopener noreferrer';
  return a;
}
/** The On/Off switch, plus a line saying when it was changed here (or why it cannot be switched on). */
function switchRow(x) {
  const row = el('div', 'rv-switch-row');
  const on = isOn(x);
  const why = on ? null : cannotRun(x);
  const b = el('button', `rv-switch${on ? ' is-on' : ''}`);
  b.type = 'button';
  b.setAttribute('role', 'switch');
  b.setAttribute('aria-checked', String(on));
  b.setAttribute('aria-label', `${x.name}: ${on ? S.revOn : S.revOff}`);
  b.append(el('span', 'rv-knob'), el('span', 'rv-switch-label', on ? S.revOn : S.revOff));
  if (why || !switches?.switchable) b.disabled = true;
  b.addEventListener('click', () => flip(x, !on, b));
  row.append(b);
  const changed = switches?.map.get(x.id);
  if (why) row.append(el('span', 'rv-note', why));
  else if (!switches?.switchable) row.append(el('span', 'rv-note', S.revSwitchSetup));
  else if (changed) row.append(el('span', 'rv-note', `${S.revChangedHere} ${day(changed.changed_at)}`));
  return row;
}
async function flip(x, allowed, b) {
  b.disabled = true;
  const r = await api(`/v1/review/sources/${encodeURIComponent(x.id)}`, { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'scamdb' }, body: JSON.stringify({ allowed }) });
  if (!r?.ok) { b.disabled = false; return fail((await r?.json().catch(() => null))?.message ?? S.revFail); }
  const body = await r.json();
  if (body.isDefault) switches.map.delete(x.id);
  else switches.map.set(x.id, { id: x.id, allowed, changed_at: body.changedAt });
  showSources();
}
function sourceCard(x, r) {
  const li = el('li', 'rv-src');
  const top = el('div', 'rv-row');
  top.append(el('span', 'rv-name', x.name));
  li.append(top, el('p', 'rv-meta', meta(x)), result(r, S.revNotRead), switchRow(x));
  if (x.note) { const d = el('details', 'rv-more-info'); d.append(el('summary', null, '…'), el('p', 'rv-note', x.note), siteLink(x)); li.append(d); }
  return li;
}
function sourceLine(x, r) {
  const li = el('li', 'rv-src-off');
  const d = el('details');
  const sum = el('summary');
  sum.append(el('span', 'rv-name', x.name), el('span', 'rv-badge', S.revOff));
  d.append(sum, el('p', 'rv-meta', meta(x)));
  if (r) d.append(result(r));
  d.append(switchRow(x));
  if (x.note) d.append(el('p', 'rv-note', x.note));
  d.append(siteLink(x));
  li.append(d);
  return li;
}

async function showRuns() {
  const list = await loadRuns();
  if (!list) return;
  const box = $('rv-run-list');
  box.replaceChildren();
  if (!list.length) { box.append(el('li', 'small', S.revNoRuns)); return; }
  for (const run of list) {
    const li = el('li', 'rv-run');
    const top = el('div', 'rv-row');
    top.append(el('b', null, day(run.received_at)), el('span', `rv-res ${run.ok ? 'is-ok' : 'is-fail'}`, run.ok ? S.revRunOk : S.revRunFailed));
    const failedSources = run.sources.filter((x) => !x.ok).length;
    const summary = run.error ?? `${run.sources.length} ${S.revSourcesRead} · ${run.added} ${S.revNewInQueue}`;
    const d = el('details');
    d.open = !run.ok || failedSources > 0;
    d.append(el('summary', null, S.revPerSource));
    const ul = el('ul', 'rv-run-sources');
    for (const x of run.sources) ul.append(el('li', `rv-res ${x.ok ? 'is-ok' : 'is-fail'}`, `${x.id}: ${resultText(x)}`));
    d.append(ul);
    li.append(top, el('p', 'rv-note', summary), d);
    box.append(li);
  }
}

for (const b of root.querySelectorAll('[data-filter]')) b.addEventListener('click', () => {
  filter = b.dataset.filter;
  for (const x of root.querySelectorAll('[data-filter]')) x.setAttribute('aria-selected', String(x === b));
  showSources();
});
function route() {
  const view = ['sources', 'runs'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'queue';
  for (const p of root.querySelectorAll('[data-panel]')) p.hidden = p.dataset.panel !== view;
  for (const a of root.querySelectorAll('[data-view]')) { if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
  if (view === 'sources') showSources();
  if (view === 'runs') showRuns();
}
addEventListener('hashchange', route);
select('new');
route();
