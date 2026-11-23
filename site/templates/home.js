import { esc, L } from './html.js';
import { layout } from './layout.js';
import { t } from '../i18n.js';
import { steps, card, entryUrl } from './parts.js';
import { UI_ICONS } from './icons.js';
import { pick } from '../../lib/text.js';
import { sketch, roundRect } from '../../lib/sketch.js';

export const FEATURED = ['us/bank-fraud-alert-zelle', 'us/toll-text', 'us/family-emergency-call'];
export const ROUTE = 'us/bank-fraud-alert-zelle';
export const SAMPLES = [
  { text: "This is your bank's fraud team. We've stopped a suspicious payment of $1,480. To protect your money, read me the 6-digit code we just sent you. Please don't hang up." },
  { text: "Hi Mum, I dropped my phone, this is my new number. Can you transfer $950 for the hotel tonight? I'll pay you back x" },
  { text: "Hi Sarah, a reminder of your appointment with Dr Lee tomorrow at 10:30. Let us know if you can't make it. Thanks!" },
];
const VERDICT_KEY = { scam: 'vScam', suspicious: 'vSuspicious', not_recognised: 'vNone' };

/** A wavy pen line `w` wide: stands in for text in drawings. */
const wave = (x, y, w) => { let d = `M${x} ${y}`; for (let i = 0; i < w; i += 12) d += ' q3 -4 6 0 t6 0'; return d; };

const HERO_ART = (() => {
  const k = sketch(601);
  const bx = 174, bw = 162, tx = bx + 24;
  const notes = sketch(651);
  const arrow = (d, head, kind = 'thin') => notes.path(d, { kind }) + notes.path(head, { kind });
  return `<svg viewBox="0 0 540 460" role="img" aria-labelledby="hero-t"><title id="hero-t">${'${title}'}</title>
${k.path(roundRect(165, 30, 210, 390, 30), { fill: 'card', shade: true })}
${k.line(245, 52, 295, 52, { kind: 'thin' })}
<text class="t-ui" x="204" y="85" font-weight="600">“Bank Fraud”</text><text class="t-mono" x="204" y="100">+1 (555) ··· 0142</text>
${k.line(182, 116, 358, 116, { kind: 'thin' })}
${k.path(`M${bx + 12} 130 h${bw - 12} a12 12 0 0 1 12 12 v86 a12 12 0 0 1 -12 12 h-${bw - 24} l-12 12 v-110 a12 12 0 0 1 12 -12 z`, { fill: 'paper', shade: true })}
${k.path(wave(tx - 2, 152, 108), { kind: 'thin' })}
<rect class="f-hl" x="${tx - 2}" y="166" width="118" height="38" rx="6"/>${k.rect(tx - 2, 166, 118, 38)}
${k.circle(tx + 20, 185, 22, { kind: 'acc' })}${k.circle(tx + 20, 185, 7, { kind: 'thin' })}${k.path(`M${tx + 31} 185 h66 M${tx + 79} 185 v10 M${tx + 89} 185 v13 M${tx + 97} 185 v8`, { kind: 'acc' })}
${k.path(wave(tx - 2, 218, 84), { kind: 'thin' })}${k.path(wave(tx - 2, 232, 48))}
${k.rect(214, 268, 134, 44, { kind: 'thin' })}
<text class="t-mono" x="226" y="285">SMS · phone</text>${k.circle(235, 301, 10, { kind: 'acc' })}${k.circle(235, 301, 3, { kind: 'thin' })}${k.path('M241 301 h46 M276 301 v6 M283 301 v8', { kind: 'acc' })}
<g transform="rotate(-9 270 366)">${k.rect(195, 340, 150, 52, { kind: 'acc' })}<text x="270" y="375" text-anchor="middle" class="t-stamp t-stamp-big">${'${stamp}'}</text></g>
<text class="t-hand" x="20" y="92">${'${n1}'}</text>${arrow('M118 96 C 145 104, 160 94, 184 88', 'M176 82 L186 88 L176 94')}
<text class="t-hand" x="30" y="232">${'${n2}'}</text>${arrow(`M120 228 C 140 236, 150 236, ${tx - 6} 230`, `M${tx - 14} 224 L${tx - 4} 230 L${tx - 14} 236`)}
<text class="t-hand-acc" x="400" y="182">${'${n3a}'}</text><text class="t-hand-acc" x="400" y="204">${'${n3b}'}</text>${arrow('M396 194 C 380 200, 368 202, 352 199', 'M362 192 L351 199 L362 206', 'acc')}
<text class="t-hand" x="400" y="300">${'${n4a}'}</text><text class="t-hand" x="400" y="322">${'${n4b}'}</text>${arrow('M396 302 C 380 298, 366 294, 352 292', 'M361 285 L351 292 L361 298')}
<text class="t-mono" x="352" y="440">us/bank-fraud-alert-zelle</text></svg>`;
})();
const MARK = sketch(701).path('M3 12 C 50 4, 120 4, 197 10 M20 16 C 70 11, 130 12, 180 15', { kind: 'acc' });

/** The hero drawing with its notes in the interface language. */
export const heroArt = (w) => HERO_ART.replace('${title}', w.title).replace('${stamp}', w.stamp)
  .replace('${n1}', w.n1).replace('${n2}', w.n2).replace('${n3a}', w.n3a).replace('${n3b}', w.n3b).replace('${n4a}', w.n4a).replace('${n4b}', w.n4b);
/** "Report this message" under a check's result: the message goes to the report form, already filled in. */
export const reportButton = (ui = 'en') => `<p class="pg-report"><a class="btn" href="/report/" data-report>${UI_ICONS.send}<span>${esc(t(ui, 'reportThis'))}</span></a></p>`;
/** The response panel as HTML (build time, for the no-JS state; playground.js renders the same markup). */
export function resultHtml(r, entriesById, signalsById, ui = 'en') {
  const sigs = r.signals.map((s) => `<li><code>${esc(s.id)}</code><span>${esc(pick(signalsById.get(s.id)?.label, ui) ?? s.id)}: <q>${esc(s.evidence)}</q></span></li>`).join('');
  const m = r.matches[0] && entriesById.get(r.matches[0].id);
  const match = m ? `${t(ui, 'matches')} <a href="${entryUrl(m)}">${esc(m.id)}</a>, ${L(m.name, 'en')}` : esc(t(ui, 'noMatch'));
  return `<div class="verdict" data-verdict="${esc(r.verdict)}"><span class="stamp">${esc(t(ui, VERDICT_KEY[r.verdict]))}</span><span class="noscore">${esc(t(ui, 'noScore'))}</span></div>
<ul class="why">${sigs || `<li><code>no_signals</code><span>${esc(t(ui, 'noSignals'))}</span></li>`}</ul><p class="match">${match}</p>${r.warning ? `<p class="warning-note">${esc(t(ui, 'warningNote'))}</p>` : ''}${reportButton(ui)}`;
}

export function home({ repo, meta, matchMessage, lang = 'en' }) {
  const P = '';
  const byId = new Map(repo.entries.map((e) => [e.id, e]));
  const signalsById = new Map(repo.signals.map((s) => [s.id, s]));
  const route = byId.get(ROUTE) ?? repo.entries.find((e) => e.steps?.length);
  const featured = [...FEATURED.map((id) => byId.get(id)).filter(Boolean), ...repo.entries.filter((e) => !FEATURED.includes(e.id))].slice(0, 3);
  const sample = matchMessage(SAMPLES[0].text, repo.entries);
  const labels = t(lang, 'pgSampleLabels');
  const strings = { scam: t(lang, 'vScam'), suspicious: t(lang, 'vSuspicious'), not_recognised: t(lang, 'vNone'), noScore: t(lang, 'noScore'),
    noSignals: t(lang, 'noSignals'), matches: t(lang, 'matches'), noMatch: t(lang, 'noMatch'), apiScore: t(lang, 'apiScore'), apiNoKey: t(lang, 'apiNoKey'), apiAiPending: t(lang, 'apiAiPending'), apiAiNone: t(lang, 'apiAiNone'),
    warningNote: t(lang, 'warningNote'), warningShort: t(lang, 'warningShort'), seenAbroad: t(lang, 'pgSeenAbroad') };
  const countries = [...repo.countries].sort((a, b) => a.name.en.localeCompare(b.name.en, 'en'))
    .map((c) => `<option value="${esc(c.code)}">${esc(c.name.en)}</option>`).join('');
  const body = `
<section class="hero">
  <div>
    <p class="eyebrow">${esc(t(lang, 'eyebrow', repo.entries.length))}</p>
    <h1>${esc(t(lang, 'h1a'))} <span class="mark">${esc(t(lang, 'h1b'))}<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">${MARK}</svg></span></h1>
    <p class="lede">${esc(t(lang, 'lede'))}</p>
    <div class="btns"><a class="btn solid" href="${P}/catalogue/">${esc(t(lang, 'btnCatalogue'))}</a><a class="btn" href="${P}/docs/">${esc(t(lang, 'btnDocs'))}</a><a class="btn" href="${P}/account/">${esc(t(lang, 'btnKey'))}</a></div>
  </div>
  <div class="hero-art">${heroArt(t(lang, 'hero'))}</div>
</section>

<section class="panel" aria-labelledby="pg-h">
  <div class="pcol">
    <h2 id="pg-h" class="plab"><span>${esc(t(lang, 'pgTitle'))}</span><span>${esc(t(lang, 'pgPrivate'))}</span></h2>
    <div class="samples" role="group" aria-label="${esc(t(lang, 'pgSamples'))}">${SAMPLES.map((s, i) => `<button type="button" data-sample="${i}" data-text="${esc(s.text)}" aria-pressed="${i === 0}">${esc(labels[i])}</button>`).join('')}</div>
    <label class="sr" for="pg-text">${esc(t(lang, 'pgMessage'))}</label>
    <textarea id="pg-text" rows="5" maxlength="5000">${esc(SAMPLES[0].text)}</textarea>
    <p class="pg-where"><label for="pg-country">${esc(t(lang, 'pgCountry'))}</label><select id="pg-country"><option value="">${esc(t(lang, 'pgAnyCountry'))}</option>${countries}</select></p>
    <p class="curl">${esc(t(lang, 'pgSoon'))} <b>POST scamdb.dev/v1/isitascam</b> <button type="button" class="icon-btn api-btn" id="pg-api" aria-label="${esc(t(lang, 'pgApi'))}" title="${esc(t(lang, 'pgApi'))}">${UI_ICONS.send}</button></p>
    <p class="api-sum" id="pg-api-sum" aria-live="polite" hidden></p>
    <pre class="api-out" aria-live="polite" hidden></pre>
  </div>
  <div class="pcol" aria-live="polite" id="pg-out" data-report-button="${esc(reportButton(lang))}" data-strings="${esc(JSON.stringify(strings))}" data-lang="${lang}">${resultHtml(sample, byId, signalsById, lang)}</div>
</section>

${route ? `<section class="route" aria-labelledby="route-h">
  <div class="sh"><h2 id="route-h">${esc(t(lang, 'scriptH'))}</h2><p>${esc(t(lang, 'scriptP'))} <a href="${entryUrl(route)}">${esc(route.id)}</a>.</p></div>
  ${steps(route, signalsById, 'en', lang)}
</section>` : ''}

<section aria-labelledby="cat-h">
  <div class="sh"><h2 id="cat-h">${esc(t(lang, 'catH'))}</h2><p>${esc(t(lang, 'catP'))} <a href="${P}/catalogue/">${esc(t(lang, 'seeAll', repo.entries.length))}</a>.</p></div>
  <div class="specimens">${featured.map((e) => card(e, lang)).join('')}</div>
</section>

<section class="eps" aria-labelledby="ep-h">
  <h2 id="ep-h" class="sr">${esc(t(lang, 'epH'))}</h2>
  <div class="ep"><code>GET /v1/us/scams.json</code><p>${esc(t(lang, 'epCountry'))}</p><span class="tier">${esc(t(lang, 'tierFree'))}</span></div>
  <div class="ep"><code>GET /v1/scams/{id}.json</code><p>${esc(t(lang, 'epOne'))}</p><span class="tier">${esc(t(lang, 'tierFree'))}</span></div>
  <div class="ep"><code>POST /v1/reports</code><p>${esc(t(lang, 'epReport'))}</p><span class="tier">${esc(t(lang, 'tierPrivate'))}</span></div>
  <div class="ep"><code>POST /v1/isitascam</code><p>${esc(t(lang, 'epCheck'))}</p><span class="tier">${esc(t(lang, 'tierCheck'))}</span></div>
</section>`;
  return layout({ title: t(lang, 'homeTitle'), description: t(lang, 'homeDesc'), body, path: '/', meta, lang,
    scripts: '<script type="module" src="/assets/playground.js"></script>' });
}
