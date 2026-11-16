// Account page: GitHub login, the API key (masked like a password, with show/hide and copy), usage, replace, delete,
// sign out. Every server value is inserted with textContent or as an input value, never as HTML.
const root = document.getElementById('acc');
const S = JSON.parse(root.dataset.strings || '{}');
const ICONS = JSON.parse(root.dataset.icons || '{}');
const $ = (id) => document.getElementById(id);
const HEADERS = { 'x-requested-with': 'scamdb' };
const api = (path, init = {}) => fetch(path, { credentials: 'same-origin', ...init }).catch(() => null);

let me = null;
let plain = null; // the revealed key, kept only in memory while the page is open

const fail = (msg = S.accFail) => { $('acc-err').textContent = msg; $('acc-err').hidden = false; };
const errParam = new URLSearchParams(location.search).get('error');
if (errParam === 'github') fail(S.accGithubError);
if (errParam === 'setup') fail(S.accSetup);

function mask() {
  const input = $('acc-key');
  input.type = 'password';
  input.value = me?.prefix ? me.prefix.replace('…', '') + '•'.repeat(36) : '';
  const eye = $('acc-eye');
  eye.innerHTML = ICONS.eye; eye.setAttribute('aria-label', S.accShow); eye.title = S.accShow; eye.setAttribute('aria-pressed', 'false');
}
function unmask() {
  const input = $('acc-key');
  input.type = 'text'; input.value = plain;
  const eye = $('acc-eye');
  eye.innerHTML = ICONS.eyeOff; eye.setAttribute('aria-label', S.accHide); eye.title = S.accHide; eye.setAttribute('aria-pressed', 'true');
}

function show() {
  $('acc-out').hidden = true;
  $('acc-in').hidden = false;
  if (!errParam) $('acc-err').hidden = true;
  $('acc-login').textContent = me.login;
  $('acc-keyrow').hidden = !me.hasKey;
  $('acc-nokey').hidden = me.hasKey;
  $('acc-usage').textContent = `${S.accUsage}: ${me.usageToday.reports} / ${me.limits.reports}`;
  $('acc-hint').textContent = '';
  // A key that can't be shown again (no stored copy) gets no show or copy buttons, just the hint, unless it was
  // created on this page view and is still in memory.
  const canView = me.viewable || !!plain;
  $('acc-eye').hidden = !canView;
  $('acc-copy').hidden = !canView;
  if (me.hasKey && !canView) $('acc-hint').textContent = S.accNotViewable;
  if (me.hasKey) { if (plain && $('acc-key').type === 'text') unmask(); else mask(); }
}

async function load() {
  const r = await api('/v1/keys/me');
  if (!r) return fail();
  if (r.status === 401) { me = null; plain = null; $('acc-in').hidden = true; $('acc-out').hidden = false; return; }
  if (r.status === 503) { if (errParam !== 'setup') fail(S.accSetup); return; }
  if (!r.ok) return fail();
  me = await r.json();
  show();
}

/** Fetches the key once per page view; returns null (with a hint) when it can't be revealed. */
async function getPlain() {
  if (plain) return plain;
  const r = await api('/v1/keys/me/reveal', { headers: HEADERS });
  if (r?.status === 404) { me.viewable = false; show(); return null; }
  if (!r?.ok) { fail(); return null; }
  plain = (await r.json()).key;
  return plain;
}

$('acc-eye').addEventListener('click', async () => {
  if ($('acc-key').type === 'text') return mask();
  if (await getPlain()) unmask();
});
$('acc-copy').addEventListener('click', async () => {
  const key = await getPlain();
  if (!key) return;
  try { await navigator.clipboard.writeText(key); $('acc-hint').textContent = S.accCopied; }
  catch { unmask(); $('acc-key').select(); }
});
async function create() {
  const r = await api('/v1/keys', { method: 'POST', headers: HEADERS });
  if (!r?.ok) return fail(r?.status === 503 ? S.accSetup : S.accFail);
  plain = (await r.json()).key;
  await load();
}
$('acc-create').addEventListener('click', create);
$('acc-replace').addEventListener('click', () => { if (confirm(S.accReplaceConfirm)) create(); });
$('acc-delete').addEventListener('click', async () => {
  if (!confirm(S.accDeleteConfirm)) return;
  const r = await api('/v1/keys/me', { method: 'DELETE', headers: HEADERS });
  if (!r?.ok) return fail();
  plain = null;
  await load();
});
$('acc-signout').addEventListener('click', async () => {
  const r = await api('/auth/logout', { method: 'POST', headers: HEADERS });
  if (!r?.ok) return fail();
  await load();
});

load();
