// Account page: shows the GitHub login, the key prefix and today's usage; creates, replaces and deletes the key.
// Every server value is inserted with textContent, never as HTML.
const root = document.getElementById('acc');
const S = JSON.parse(root.dataset.strings || '{}');
const $ = (id) => document.getElementById(id);
const HEADERS = { 'x-requested-with': 'scamdb' };

if (new URLSearchParams(location.search).get('error') === 'github') $('acc-err').hidden = false;

function show(me) {
  $('acc-out').hidden = true;
  $('acc-in').hidden = false;
  $('acc-login').textContent = me.login;
  $('acc-key').textContent = me.hasKey ? `${S.accHasKey} ${me.prefix}` : S.accNoKey;
  $('acc-usage').textContent = `${S.accUsage}: ${me.usageToday.reports} / ${me.limits.reports}`;
  $('acc-create').textContent = me.hasKey ? S.accReplace : S.accCreate;
  $('acc-create').title = me.hasKey ? S.accReplaceConfirm : '';
  $('acc-delete').hidden = !me.hasKey;
}

async function load() {
  try {
    const r = await fetch('/v1/keys/me', { credentials: 'same-origin' });
    if (r.status === 401) return; // signed out: the sign-in view is already showing
    if (!r.ok) throw new Error(String(r.status));
    show(await r.json());
  } catch {
    $('acc-err').textContent = S.accFail;
    $('acc-err').hidden = false;
  }
}

$('acc-create').addEventListener('click', async () => {
  const r = await fetch('/v1/keys', { method: 'POST', headers: HEADERS, credentials: 'same-origin' });
  if (!r.ok) { $('acc-err').textContent = S.accFail; $('acc-err').hidden = false; return; }
  const { key } = await r.json();
  $('acc-new-key').textContent = key;
  $('acc-new').hidden = false;
  await load();
});
$('acc-delete').addEventListener('click', async () => {
  await fetch('/v1/keys/me', { method: 'DELETE', headers: HEADERS, credentials: 'same-origin' });
  $('acc-new').hidden = true;
  await load();
});
$('acc-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('acc-new-key').textContent); $('acc-copy').textContent = S.accCopied; }
  catch { getSelection().selectAllChildren($('acc-new-key')); }
});

load();
