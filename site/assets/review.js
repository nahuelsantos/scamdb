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
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

async function load(more = false) {
  const before = more && items.length ? items[items.length - 1].id : null;
  const q = new URLSearchParams({ status, limit: String(PAGE), ...(before ? { before: String(before) } : {}) });
  const r = await fetch(`/v1/review/items?${q}`, { credentials: 'same-origin' }).catch(() => null);
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
  const r = await fetch(`/v1/review/items/${it.id}`, { method: 'POST', credentials: 'same-origin',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'scamdb' }, body: JSON.stringify({ status: next }) }).catch(() => null);
  if (!r?.ok) { li.classList.remove('busy'); return fail(); }
  li.remove();
  items = items.filter((x) => x.id !== it.id);
  for (const [k, d] of [[status, -1], [next, 1]]) { const c = root.querySelector(`[data-count="${k}"]`); if (c) c.textContent = String(Math.max(0, Number(c.textContent) + d)); }
  $('rv-empty').hidden = items.length > 0;
}

function select(next) {
  status = next;
  for (const b of root.querySelectorAll('.rv-tab')) b.setAttribute('aria-selected', String(b.dataset.status === status));
  load();
}
for (const b of root.querySelectorAll('.rv-tab')) b.addEventListener('click', () => select(b.dataset.status));
$('rv-more').addEventListener('click', () => load(true));
select('new');
