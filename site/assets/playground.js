// The homepage playground: runs the scamdb matcher in the browser. Nothing is sent anywhere.
import { matchMessage } from './packages/matcher/index.js';

const SAMPLES = [...document.querySelectorAll('[data-sample]')];
const box = document.getElementById('pg-text');
const out = document.getElementById('pg-out');
const TEXTS = [
  'Buenas tardes, le hablo de PAMI. ¿Usted tiene un trámite iniciado? Le va a llegar un código por mensaje, ¿me lo lee así lo confirmamos? Es para hoy.',
  'Mamá, soy yo, estoy en problemas, no le digas a nadie. Ahora te llama un señor que me está ayudando. No cortes.',
  'Hola Marta, te recuerdo el turno con la Dra. López mañana a las 10:30. Si no podés venir avisanos. Saludos!',
];
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
  box.value = TEXTS[Number(b.dataset.sample)];
  SAMPLES.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  check();
}));
