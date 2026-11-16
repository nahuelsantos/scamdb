// Account page: shows the GitHub login, the key prefix and today's usage; creates, replaces and deletes the key.
// Every server value is inserted with textContent, never as HTML.
const root = document.getElementById('acc');
const S = JSON.parse(root.dataset.strings || '{}');
const $ = (id) => document.getElementById(id);
const HEADERS = { 'x-requested-with': 'scamdb' };

const fail = (msg = S.accFail) => { $('acc-err').textContent = msg; $('acc-err').hidden = false; };
const errParam = new URLSearchParams(location.search).get('error');
if (errParam === 'github') fail(S.accGithubError);
if (errParam === 'setup') fail(S.accSetup);

function show(me) {
  $('acc-out').hidden = true;
  $('acc-in').hidden = false;
  if (!errParam) $('acc-err').hidden = true;
  $('acc-login').textContent = me.login;
  $('acc-key').textContent = me.hasKey ? `${S.accHasKey} ${me.prefix}` : S.accNoKey;
  $('acc-usage').textContent = `${S.accUsage}: ${me.usageToday.reports} / ${me.limits.reports}`;
  $('acc-create').textContent = me.hasKey ? S.accReplace : S.accCreate;
  $('acc-delete').hidden = !me.hasKey;
}

async function load() {
  try {
    const r = await fetch('/v1/keys/me', { credentials: 'same-origin' });
    if (r.status === 401) { $('acc-in').hidden = true; $('acc-out').hidden = false; return; } // signed out
    if (r.status === 503) { if (errParam !== 'setup') fail(S.accSetup); return; }
    if (!r.ok) throw new Error(String(r.status));
    show(await r.json());
  } catch { fail(); }
}

$('acc-create').addEventListener('click', async () => {
  if ($('acc-delete').hidden === false && !confirm(S.accReplaceConfirm)) return;
  const r = await fetch('/v1/keys', { method: 'POST', headers: HEADERS, credentials: 'same-origin' }).catch(() => null);
  if (!r?.ok) { fail(r?.status === 503 ? S.accSetup : S.accFail); return; }
  const { key } = await r.json();
  $('acc-new-key').textContent = key;
  $('acc-new').hidden = false;
  await $('acc-signout').addEventListener('click', async () => {
  const r = await fetch('/auth/logout', { method: 'POST', headers: HEADERS, credentials: 'same-origin' }).catch(() => null);
  if (!r?.ok) { fail(); return; }
  $('acc-new').hidden = true;
  await load();
});

load();
});
$('acc-delete').addEventListener('click', async () => {
  if (!confirm(S.accDeleteConfirm)) return;
  const r = await fetch('/v1/keys/me', { method: 'DELETE', headers: HEADERS, credentials: 'same-origin' }).catch(() => null);
  if (!r?.ok) { fail(); return; }
  $('acc-new').hidden = true;
  await $('acc-signout').addEventListener('click', async () => {
  const r = await fetch('/auth/logout', { method: 'POST', headers: HEADERS, credentials: 'same-origin' }).catch(() => null);
  if (!r?.ok) { fail(); return; }
  $('acc-new').hidden = true;
  await load();
});

load();
});
$('acc-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('acc-new-key').textContent); $('acc-copy').textContent = S.accCopied; }
  catch { getSelection().selectAllChildren($('acc-new-key')); }
});

$('acc-signout').addEventListener('click', async () => {
  const r = await fetch('/auth/logout', { method: 'POST', headers: HEADERS, credentials: 'same-origin' }).catch(() => null);
  if (!r?.ok) { fail(); return; }
  $('acc-new').hidden = true;
  await load();
});

load();
