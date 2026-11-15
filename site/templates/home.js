import { esc, L } from './html.js';
import { layout } from './layout.js';
import { steps, card, entryUrl } from './parts.js';
import { pick } from '../../lib/text.js';
import { sketch, roundRect } from '../../lib/sketch.js';

export const FEATURED = ['ar/cuento-del-tio', 'ar/falso-banco', 'ar/acceso-remoto'];
export const ROUTE = 'ar/whatsapp-codigo';
export const SAMPLES = [
  { label: 'PAMI code', text: 'Buenas tardes, le hablo de PAMI. ¿Usted tiene un trámite iniciado? Le va a llegar un código por mensaje, ¿me lo lee así lo confirmamos? Es para hoy.' },
  { label: '“Mamá, soy yo”', text: 'Mamá, soy yo, estoy en problemas, no le digas a nadie. Ahora te llama un señor que me está ayudando. No cortes.' },
  { label: 'Dentist reminder', text: 'Hola Marta, te recuerdo el turno con la Dra. López mañana a las 10:30. Si no podés venir avisanos. Saludos!' },
];
const VERDICT_TEXT = { scam: 'scam', suspicious: 'suspicious', not_recognised: 'not recognised' };

const HERO_ART = (() => {
  const k = sketch(601);
  const bx = 174, bw = 162, tx = bx + 24;
  const notes = sketch(651);
  const arrow = (d, head, kind = 'thin') => notes.path(d, { kind }) + notes.path(head, { kind });
  return `<svg viewBox="0 0 540 460" role="img" aria-labelledby="hero-t"><title id="hero-t">${'${title}'}</title>
${k.path(roundRect(165, 30, 210, 390, 30), { fill: 'card', shade: true })}
${k.line(245, 52, 295, 52, { kind: 'thin' })}${k.circle(270, 400, 18)}${k.circle(200, 88, 26)}
<text class="t-ui" x="222" y="85" font-weight="600">“PAMI”</text><text class="t-mono" x="222" y="100">+54 11 ···· 2231</text>
${k.line(182, 116, 358, 116, { kind: 'thin' })}
${k.path(`M${bx + 12} 130 h${bw - 12} a12 12 0 0 1 12 12 v86 a12 12 0 0 1 -12 12 h-${bw - 24} l-12 12 v-110 a12 12 0 0 1 12 -12 z`, { fill: 'paper', shade: true })}
<rect class="f-hl" x="${tx - 2}" y="186" width="46" height="17" rx="3"/>
<text class="t-ui" x="${tx}" y="156">Le hablo de PAMI.</text><text class="t-ui" x="${tx}" y="176">Le va a llegar un</text><text class="t-ui" x="${tx}" y="198">código, ¿me lo lee</text><text class="t-ui" x="${tx}" y="218">así confirmamos?</text><text class="t-ui" x="${tx}" y="234" font-weight="600" font-size="12">Es para hoy.</text>
${k.rect(214, 268, 134, 44, { kind: 'thin' })}
<text class="t-mono" x="226" y="285">SMS · WhatsApp</text><text class="t-ui" x="226" y="303" font-weight="600" letter-spacing="2">482-913</text>
<g transform="rotate(-9 270 352)">${k.rect(206, 332, 128, 40, { kind: 'acc' })}<text x="270" y="359" text-anchor="middle" class="t-stamp">${'${stamp}'}</text></g>
<text class="t-hand" x="20" y="92">${'${n1}'}</text>${arrow('M118 96 C 145 104, 160 94, 184 88', 'M176 82 L186 88 L176 94')}
<text class="t-hand" x="30" y="232">${'${n2}'}</text>${arrow(`M120 228 C 140 236, 150 236, ${tx - 6} 232`, `M${tx - 14} 226 L${tx - 4} 232 L${tx - 14} 238`)}
<text class="t-hand-acc" x="400" y="182">${'${n3a}'}</text><text class="t-hand-acc" x="400" y="204">${'${n3b}'}</text>${arrow('M396 194 C 380 200, 368 202, 352 199', 'M362 192 L351 199 L362 206', 'acc')}
<text class="t-hand" x="400" y="300">${'${n4a}'}</text><text class="t-hand" x="400" y="322">${'${n4b}'}</text>${arrow('M396 302 C 380 298, 366 294, 352 292', 'M361 285 L351 292 L361 298')}
<text class="t-mono" x="392" y="440">ar/whatsapp-codigo</text></svg>`;
})();
const MARK = sketch(701).path('M3 12 C 50 4, 120 4, 197 10 M20 16 C 70 11, 130 12, 180 15', { kind: 'acc' });

/** The hero drawing with its notes in the interface language. */
export const heroArt = (w) => HERO_ART.replace('${title}', w.title).replace('${stamp}', w.stamp)
  .replace('${n1}', w.n1).replace('${n2}', w.n2).replace('${n3a}', w.n3a).replace('${n3b}', w.n3b).replace('${n4a}', w.n4a).replace('${n4b}', w.n4b);
const HERO_EN = { title: 'A drawn phone showing the PAMI code scam, with handwritten notes pointing at each warning sign', stamp: 'SCAM',
  n1: 'fake agency', n2: 'rushes you', n3a: 'asks for', n3b: 'a code!', n4a: 'never read it', n4b: 'to anyone' };

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
    <h1>A field guide to <span class="mark">scams.<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">${MARK}</svg></span></h1>
    <p class="lede">How each scam works, the words it uses, the warning signs and who to call, country by country. Free to download and free to build on.</p>
    <div class="btns"><a class="btn solid" href="/catalogue/">Browse the catalogue</a><a class="btn" href="/docs/">Read the docs</a></div>
  </div>
  <div class="hero-art">${heroArt(HERO_EN)}</div>
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
