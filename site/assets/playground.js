// The homepage playground: runs the scamdb matcher in the browser. Nothing is sent anywhere.
import { matchMessage } from './packages/matcher/index.js';
import { guessCountry, browserHints } from './guess-country.js';

const SAMPLES = [...document.querySelectorAll('[data-sample]')];
const box = document.getElementById('pg-text');
const out = document.getElementById('pg-out');
// Interface strings come from the page.
const S = JSON.parse(out.dataset.strings || '{}');
const LANG = out.dataset.lang || 'en';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const english = (t) => (t ? (t.en ?? Object.values(t)[0]) : '');

// The country the message arrived in: guessed from the time zone and language, remembered once chosen ('any' = none).
// Local scams are matched first; a strong fit documented elsewhere is shown as "Also seen in".
const where = document.getElementById('pg-country');
const country = () => where?.value || '';
const countryName = (cc) => [...(where?.options ?? [])].find((o) => o.value === cc)?.text ?? cc;
if (where) {
  const available = new Set([...where.options].map((o) => o.value).filter(Boolean));
  let saved = null;
  try { saved = localStorage.getItem('scamdb:country'); } catch { /* storage blocked: guess every time */ }
  where.value = saved === 'any' ? '' : saved && available.has(saved) ? saved : guessCountry(browserHints(), available);
}

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
  const abroad = (r.elsewhere ?? []).map((x) => byId.get(x.id)).filter(Boolean)
    .map((e) => `<a href="/catalogue/${esc(e.id)}/">${esc(e.id)}</a>, <span lang="en">${esc(english(e.name))}</span> (${esc(countryName(e.country))})`);
  const seen = abroad.length ? `<p class="match elsewhere">${esc(S.seenAbroad)} ${abroad.join('; ')}</p>` : '';
  out.innerHTML = `<div class="verdict" data-verdict="${esc(r.verdict)}"><span class="stamp">${esc(S[r.verdict])}</span><span class="noscore">${esc(S.noScore)}</span></div>
<ul class="why">${sigs}</ul><p class="match">${match}</p>${seen}${r.warning ? `<p class="warning-note">${esc(S.warningNote)}</p>` : ''}${out.dataset.reportButton ?? ''}`;
}

async function check() {
  const d = await load();
  const cc = country();
  render(matchMessage(box.value, d.entries, cc ? { country: cc, elsewhere: true } : {}));
}

where?.addEventListener('change', () => {
  try { localStorage.setItem('scamdb:country', where.value || 'any'); } catch { /* not remembered */ }
  check();
});
// The page arrives with the first sample checked for any country; check it again for the visitor's.
if (country()) check();

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

// "Check with the API": the same message sent to POST /v1/isitascam (a real call). Signed in with a key, the page's own
// request uses that key (X-Requested-With: scamdb + the session cookie), so the answer includes the AI score.
const apiBtn = document.getElementById('pg-api');
const apiOut = document.querySelector('.api-out');
const apiSum = document.getElementById('pg-api-sum');
function show(body) {
  apiOut.textContent = JSON.stringify(body, null, 2);
  if (!apiSum) return;
  const scored = typeof body.score === 'number';
  apiSum.textContent = scored
    ? `${S[body.verdict] ?? body.verdict} · ${S.apiScore} ${Math.round(body.score * 100)}%`
    : `${S[body.verdict] ?? body.verdict} · ${body.ai?.status === 'pending' ? S.apiAiPending : body.ai ? S.apiAiNone : S.apiNoKey}`;
  if (body.warning) apiSum.textContent += ` · ${S.warningShort}`;
  apiSum.hidden = false;
}
apiBtn?.addEventListener('click', async () => {
  apiOut.hidden = false;
  apiOut.textContent = '…';
  if (apiSum) apiSum.hidden = true;
  try {
    const r = await fetch('/v1/isitascam', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'scamdb' }, body: JSON.stringify({ text: box.value, lang: 'en', ...(country() ? { country: country() } : {}) }) });
    let body = await r.json();
    if (!r.ok) { apiOut.textContent = `${r.status} ${body.message ?? body.error ?? ''}`; return; }
    show(body);
    // With a key, the AI runs after the first answer: ask again until it is done (about 1 s apart, up to 20 s).
    const id = body.ai?.status === 'pending' ? body.ai.id : null;
    for (let i = 0; id && i < 20; i++) {
      await new Promise((ok) => setTimeout(ok, 1000));
      const next = await fetch(`/v1/isitascam/${id}`, { credentials: 'same-origin', headers: { 'x-requested-with': 'scamdb' } }).catch(() => null);
      if (!next || next.status === 202) continue;
      if (next.ok) { body = await next.json(); show(body); }
      break;
    }
    if (body.ai?.status === 'pending') { body.ai.status = 'timeout'; show(body); }
  } catch {
    apiOut.textContent = 'The API could not be reached.';
  }
});

// "Report this message": hand the message to the report form through sessionStorage (never the URL), then go there.
out.addEventListener('click', (e) => {
  if (!e.target.closest('[data-report]')) return;
  try { sessionStorage.setItem('scamdb:report', JSON.stringify({ text: box.value, ...(country() ? { country: country() } : {}) })); } catch { /* blocked: the form starts empty */ }
});
