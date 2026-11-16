// The homepage playground: runs the scamdb matcher in the browser. Nothing is sent anywhere.
import { matchMessage } from './packages/matcher/index.js';

const SAMPLES = [...document.querySelectorAll('[data-sample]')];
const box = document.getElementById('pg-text');
const out = document.getElementById('pg-out');
// Interface strings come from the page.
const S = JSON.parse(out.dataset.strings || '{}');
const LANG = out.dataset.lang || 'en';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const english = (t) => (t ? (t.en ?? Object.values(t)[0]) : '');

let data;
async function load() {
  if (!data) data = await (await fetch('/assets/entries.json')).json();
  return data;
}

function render(r) {
  const labels = new Map(data.signals.map((s) => [s.id, s.label[LANG] ?? s.label.en]));
  const byId = new Map(data.entries.map((e) => [e.id, e]));
  const sigs = r.signals.map((s) => `<li><code>${esc(s.id)}</code><span>${esc(labels.get(s.id) ?? s.id)}: <q>${esc(s.evidence)}</q></span></li>`).join('')
    || `<li><code>no_signals</code><span>${esc(S.noSignals)}</span></li>`;
  const m = r.matches[0] && byId.get(r.matches[0].id);
  const match = m ? `${esc(S.matches)} <a href="/catalogue/${esc(m.id)}/">${esc(m.id)}</a>, <span lang="en">${esc(english(m.name))}</span>`
    : esc(S.noMatch);
  out.innerHTML = `<div class="verdict" data-verdict="${esc(r.verdict)}"><span class="stamp">${esc(S[r.verdict])}</span><span class="noscore">${esc(S.noScore)}</span></div>
<ul class="why">${sigs}</ul><p class="match">${match}</p>`;
}

async function check() {
  const d = await load();
  render(matchMessage(box.value, d.entries));
}

let timer;
box.addEventListener('input', () => {
  SAMPLES.forEach((b) => b.setAttribute('aria-pressed', 'false'));
  clearTimeout(timer);
  timer = setTimeout(check, 150);
});
SAMPLES.forEach((b) => b.addEventListener('click', () => {
  box.value = b.dataset.text;
  SAMPLES.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  check();
}));

// "Check with the API": the same message sent to POST /v1/isitascam (a real call, so it counts against the keyless limit).
const apiBtn = document.getElementById('pg-api');
const apiOut = document.querySelector('.api-out');
apiBtn?.addEventListener('click', async () => {
  apiOut.hidden = false;
  apiOut.textContent = '…';
  try {
    const r = await fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: box.value, lang: 'en' }) });
    const body = await r.json();
    apiOut.textContent = r.ok ? JSON.stringify(body, null, 2) : `${r.status} ${body.message ?? body.error ?? ''}`;
  } catch {
    apiOut.textContent = 'The API could not be reached.';
  }
});
