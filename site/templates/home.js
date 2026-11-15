import { esc, L } from './html.js';
import { layout } from './layout.js';
import { steps, card, entryUrl } from './parts.js';
import { pick } from '../../lib/text.js';

export const FEATURED = ['ar/cuento-del-tio', 'ar/falso-banco', 'ar/acceso-remoto'];
export const ROUTE = 'ar/whatsapp-codigo';
export const SAMPLES = [
  { label: 'PAMI code', text: 'Buenas tardes, le hablo de PAMI. ¿Usted tiene un trámite iniciado? Le va a llegar un código por mensaje, ¿me lo lee así lo confirmamos? Es para hoy.' },
  { label: '“Mamá, soy yo”', text: 'Mamá, soy yo, estoy en problemas, no le digas a nadie. Ahora te llama un señor que me está ayudando. No cortes.' },
  { label: 'Dentist reminder', text: 'Hola Marta, te recuerdo el turno con la Dra. López mañana a las 10:30. Si no podés venir avisanos. Saludos!' },
];
const VERDICT_TEXT = { scam: 'scam', suspicious: 'suspicious', not_recognised: 'not recognised' };

const HERO_ART = `<svg viewBox="0 0 540 460" role="img" aria-labelledby="hero-t"><title id="hero-t">A drawn phone showing the PAMI code scam, with handwritten notes pointing at each warning sign</title>
<rect class="d f-card" x="165" y="30" width="210" height="390" rx="30"/><path class="d-thin" d="M245 52 h50"/><circle class="d-thin" cx="270" cy="400" r="9"/>
<circle class="d-thin" cx="200" cy="88" r="13"/><text class="t-ui" x="222" y="85" font-weight="600">“PAMI”</text><text class="t-mono" x="222" y="100">+54 11 ···· 2231</text><path class="d-thin" d="M182 116 h176"/>
<path class="d f-paper" d="M186 130 h150 a12 12 0 0 1 12 12 v86 a12 12 0 0 1 -12 12 h-138 l-12 10 v-108 a12 12 0 0 1 0 -12 z"/>
<rect class="f-hl" x="196" y="186" width="46" height="17" rx="3"/>
<text class="t-ui" x="198" y="156">Le hablo de PAMI.</text><text class="t-ui" x="198" y="176">Le va a llegar un</text><text class="t-ui" x="198" y="198">código, ¿me lo lee</text><text class="t-ui" x="198" y="218">así confirmamos?</text><text class="t-ui" x="198" y="234" font-weight="600" font-size="12">Es para hoy.</text>
<rect class="d-thin f-paper" x="214" y="268" width="134" height="44" rx="10"/><text class="t-mono" x="226" y="285">SMS · WhatsApp</text><text class="t-ui" x="226" y="303" font-weight="600" letter-spacing="2">482-913</text>
<g transform="rotate(-9 270 352)"><rect class="d-acc" x="206" y="332" width="128" height="40" rx="6"/><text x="270" y="359" text-anchor="middle" class="t-stamp">SCAM</text></g>
<text class="t-hand" x="20" y="92">fake agency</text><path class="d-thin" d="M118 96 C 145 104, 160 94, 186 88"/><path class="d-thin" d="M178 82 l9 6 -9 5"/>
<text class="t-hand" x="34" y="232">rushes you</text><path class="d-thin" d="M124 228 C 150 236, 165 236, 190 232"/><path class="d-thin" d="M182 226 l9 6 -9 6"/>
<text class="t-hand-acc" x="392" y="182">asks for</text><text class="t-hand-acc" x="392" y="204">a code!</text><path class="d-acc" d="M388 194 C 375 200, 365 202, 352 199"/><path class="d-acc" d="M361 193 l-10 6 10 6"/>
<text class="t-hand" x="392" y="300">never read it</text><text class="t-hand" x="392" y="322">to anyone</text><path class="d-thin" d="M390 302 C 375 298, 362 294, 352 292"/><path class="d-thin" d="M360 286 l-9 6 9 5"/>
<text class="t-mono" x="392" y="420">ar/whatsapp-codigo</text></svg>`;

/** The response panel as HTML (used at build time for the no-JS state; playground.js renders the same markup). */
export function resultHtml(r, entriesById, signalsById) {
  const sigs = r.signals.map((s) => `<li><code>${esc(s.id)}</code><span>${esc(pick(signalsById.get(s.id)?.label, 'en') ?? s.id)}: <q lang="es">${esc(s.evidence)}</q></span></li>`).join('');
  const m = r.matches[0] && entriesById.get(r.matches[0].id);
  const match = m ? `Matches <a href="${entryUrl(m)}">${esc(m.id)}</a>, ${L(m.name)}` : 'No known scam. If it still feels off, don’t answer and ask someone you trust.';
  return `<div class="verdict" data-verdict="${esc(r.verdict)}"><span class="stamp">${esc(VERDICT_TEXT[r.verdict])}</span><span class="noscore">score: null · catalogue match only</span></div>
<ul class="why">${sigs || '<li><code>no_signals</code><span>No codes, money, links or pressure</span></li>'}</ul><p class="match">${match}</p>`;
}

export function home({ repo, meta, matchMessage }) {
  const byId = new Map(repo.entries.map((e) => [e.id, e]));
  const signalsById = new Map(repo.signals.map((s) => [s.id, s]));
  const route = byId.get(ROUTE) ?? repo.entries.find((e) => e.steps?.length) ;
  const featured = [...FEATURED.map((id) => byId.get(id)).filter(Boolean), ...repo.entries.filter((e) => !FEATURED.includes(e.id))].slice(0, 3);
  const countries = repo.countries.filter((c) => repo.entries.some((e) => e.country === c.code)).map((c) => pick(c.name, 'en'));
  const sample = matchMessage(SAMPLES[0].text, repo.entries, { country: 'ar' });
  const body = `
<section class="hero">
  <div>
    <p class="eyebrow">${repo.entries.length} scams · ${esc(countries.join(', '))} · open data</p>
    <h1>A field guide to <span class="mark">scams.<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="d-acc" d="M3 12 C 50 4, 120 4, 197 10 M20 16 C 70 11, 130 12, 180 15"/></svg></span></h1>
    <p class="lede">How each scam works, the words it uses, the warning signs and who to call, country by country. Free to download and free to build on.</p>
    <div class="btns"><a class="btn solid" href="/catalogue/">Browse the catalogue</a><a class="btn" href="/docs/">Read the docs</a></div>
  </div>
  <div class="hero-art">${HERO_ART}</div>
</section>

<section class="panel" aria-labelledby="pg-h">
  <div class="pcol">
    <h2 id="pg-h" class="plab"><span>Is this a scam? Paste a message</span><span>runs in your browser · nothing is sent</span></h2>
    <div class="samples" role="group" aria-label="Sample messages">${SAMPLES.map((s, i) => `<button type="button" data-sample="${i}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>
    <label class="sr" for="pg-text">Message</label>
    <textarea id="pg-text" rows="5" lang="es" maxlength="5000">${esc(SAMPLES[0].text)}</textarea>
    <p class="curl">Coming soon as an API: <b>POST scamdb.dev/v1/isitascam</b></p>
  </div>
  <div class="pcol" aria-live="polite" id="pg-out">${resultHtml(sample, byId, signalsById)}</div>
</section>

${route ? `<section class="route" aria-labelledby="route-h">
  <div class="sh"><h2 id="route-h">Every scam follows a script</h2><p>Numbers and links change every week; the script stays the same for years. Each entry breaks it down step by step, with the warning sign at each stop. This is <a href="${entryUrl(route)}">${esc(route.id)}</a>.</p></div>
  ${steps(route, signalsById)}
</section>` : ''}

<section aria-labelledby="cat-h">
  <div class="sh"><h2 id="cat-h">The catalogue</h2><p>One file per scam on GitHub, reviewed before it goes live. Each one is also a JSON file you can fetch. <a href="/catalogue/">See all ${repo.entries.length}</a>.</p></div>
  <div class="specimens">${featured.map((e) => card(e)).join('')}</div>
</section>

<section class="eps" aria-labelledby="ep-h">
  <h2 id="ep-h" class="sr">Endpoints</h2>
  <div class="ep"><code>GET /v1/ar/scams.json</code><p>Every scam for a country.</p><span class="tier">free, no key</span></div>
  <div class="ep"><code>GET /v1/scams/{id}.json</code><p>One scam: examples, signs, what to do.</p><span class="tier">free, no key</span></div>
  <div class="ep"><code>GET /v1/scamdb.zip</code><p>The whole dataset, CC BY 4.0.</p><span class="tier">free, no key</span></div>
  <div class="ep"><code>POST /v1/isitascam</code><p>Text, screenshot or voice note in, verdict and reasons out.</p><span class="tier">coming soon</span></div>
</section>`;
  return layout({ title: 'scamdb · a field guide to scams', description: 'An open database of scam patterns, country by country, with a free JSON API. CC BY 4.0.', body, path: '/', meta,
    scripts: '<script type="module" src="/assets/playground.js"></script>' });
}
