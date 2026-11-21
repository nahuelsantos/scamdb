import { esc } from './html.js';
import { layout, REPO } from './layout.js';
import { t } from '../i18n.js';

const PATHS = ['/v1/index.json', '/v1/countries.json', '/v1/signals.json', '/v1/{country}/scams.json', '/v1/{country}/contacts.json',
  '/v1/scams/{country}/{slug}.json', '/v1/scams.json', '/v1/scamdb.zip', '/v1/scams.csv', '/v1/changes.json', '/v1/changes.atom', '/v1/brands.json'];
const REPORT_FIELDS = ['text', 'whatHappened', 'country', 'channel', 'outcome', 'contact', 'source', 'turnstileToken'];
const CHECK_FIELDS = ['text', 'country', 'lang', 'report', 'image', 'audio'];
const CHECK_EXAMPLE = JSON.stringify({ verdict: 'scam', score: null, signals: [{ id: 'asks_for_code', label: 'Asks for a code', evidence: 'read me the 6-digit code' }],
  matches: [{ id: 'nz/bank-fraud-team-call', name: 'Fake bank fraud team', url: 'https://scamdb.dev/v1/scams/nz/bank-fraud-team-call.json', page: 'https://scamdb.dev/catalogue/nz/bank-fraud-team-call/' }],
  whatToDo: ['Hang up and call your bank on the number on your card.'], reportTo: 'https://scamdb.dev/v1/nz/contacts.json', engine: { matcher: '1.2.0', scorer: 'matcher' }, datasetVersion: '…' }, null, 2);
const FIELDS = ['id', 'country', 'lang', 'status', 'channels', 'sender', 'name', 'how', 'steps[]', 'examples[]', 'phrases', 'signals[]', 'redFlags',
  'whatToDo', 'reportTo[]', 'sources[]', 'media[]', 'story', 'related[]', 'firstSeen', 'updated'];

export function docs({ repo, meta, lang = 'en' }) {
  const rows = t(lang, 'endpointRows'), fields = t(lang, 'fieldRows');
  const sample = repo.entries.find((e) => e.id === 'us/bank-fraud-alert-zelle') ?? repo.entries[0];
  const short = sample && JSON.stringify({ license: 'CC BY 4.0', attribution: 'scamdb.dev · CC BY 4.0', version: meta.version,
    data: { id: sample.id, country: sample.country, lang: sample.lang, name: sample.name, signals: sample.signals, '…': '…' } }, null, 2);
  const body = `<section class="page-head"><h1>${esc(t(lang, 'navDocs'))}</h1><p class="lede">${esc(t(lang, 'docsLede'))} <code>{"en": "…", "es": "…"}</code>.</p></section>
<section aria-labelledby="q-h"><h2 id="q-h">${esc(t(lang, 'dQuick'))}</h2><pre class="code"><code>curl https://scamdb.dev/v1/us/scams.json</code></pre>
<pre class="code"><code>const res = await fetch('https://scamdb.dev/v1/us/scams.json');
const { data, version } = await res.json();
console.log(data.length, 'scams, dataset', version);</code></pre></section>
<section aria-labelledby="e-h"><h2 id="e-h">${esc(t(lang, 'dEndpoints'))}</h2><div class="scroll"><table><thead><tr><th>GET</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${PATHS.map((p, i) => `<tr><td><code>${esc(p)}</code></td><td>${esc(rows[i])}</td></tr>`).join('')}</tbody></table></div></section>
<section aria-labelledby="r-h"><h2 id="r-h">${esc(t(lang, 'dResponse'))}</h2><p>${esc(t(lang, 'dResponseP'))}</p>
<pre class="code"><code>${esc(short)}</code></pre></section>
<section aria-labelledby="f-h"><h2 id="f-h">${esc(t(lang, 'dEntry'))}</h2><div class="scroll"><table><thead><tr><th>${esc(t(lang, 'dField'))}</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(fields[i])}</td></tr>`).join('')}</tbody></table></div>
<p>${esc(t(lang, 'dSchemas'))} <a href="${REPO}/tree/main/schema">schema/</a>.</p></section>
<section aria-labelledby="c-h"><h2 id="c-h">${esc(t(lang, 'dCheck'))}</h2><p>${esc(t(lang, 'dCheckP'))}</p>
<pre class="code"><code>curl -X POST https://scamdb.dev/v1/isitascam \\
  -H "Content-Type: application/json" \\
  -d '{"text": "This is the fraud team of your bank, read me the 6-digit code", "lang": "en"}'</code></pre>
<pre class="code"><code>curl -X POST https://scamdb.dev/v1/isitascam \\
  -H "Authorization: Bearer sk_…" \\
  -F image=@screenshot.png -F lang=en</code></pre>
<div class="scroll"><table><thead><tr><th>POST /v1/isitascam</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${CHECK_FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(t(lang, 'dCheckRows')[i])}</td></tr>`).join('')}</tbody></table></div>
<pre class="code"><code>${esc(CHECK_EXAMPLE)}</code></pre>
<ul class="list">${t(lang, 'dCheckNotes').map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
<h3 id="how-h">${esc(t(lang, 'dHow'))}</h3><ol class="list">${t(lang, 'dHowSteps').map((n) => `<li>${esc(n)}</li>`).join('')}</ol>
<p>${esc(t(lang, 'dHowMore'))} <a href="${REPO}/blob/main/docs/detection.md">docs/detection.md</a>.</p></section>
<section aria-labelledby="rep-h"><h2 id="rep-h">${esc(t(lang, 'dReports'))}</h2><p>${esc(t(lang, 'dReportsP'))}</p>
<pre class="code"><code>curl -X POST https://scamdb.dev/v1/reports \\
  -H "Authorization: Bearer sk_…" -H "Content-Type: application/json" \\
  -d '{"text": "Bank Fraud Alert: did you attempt a Zelle payment…", "country": "us", "channel": "sms", "source": "my-app"}'
# → 201 {"id": "…", "received": true}</code></pre>
<div class="scroll"><table><thead><tr><th>POST /v1/reports</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${REPORT_FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(t(lang, 'dReportsRows')[i])}</td></tr>`).join('')}</tbody></table></div>
<p>${esc(t(lang, 'dReportsKeyless'))}</p></section>
<section aria-labelledby="dl-h"><h2 id="dl-h">${esc(t(lang, 'dDownloadH'))}</h2><p>${esc(t(lang, 'dDownloadP'))}</p><ul class="list">${t(lang, 'dDownloadRows').map((r) => { const [path, ...rest] = r.split(': '); return `<li><a href="${esc(path)}"><code>${esc(path)}</code></a>: ${esc(rest.join(': '))}</li>`; }).join('')}</ul></section>
<section aria-labelledby="feed-h"><h2 id="feed-h">${esc(t(lang, 'feedH'))}</h2><p>${esc(t(lang, 'dFeedP'))} <a href="/feed/">/feed/</a></p></section>
<section aria-labelledby="k-h"><h2 id="k-h">${esc(t(lang, 'dKeys'))}</h2><p>${esc(t(lang, 'dKeysP'))}</p>
<div class="scroll"><table><thead><tr>${t(lang, 'dLimitsCols').map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
${t(lang, 'dLimitsRows').map(([e, a, b]) => `<tr><td><code>${esc(e)}</code></td><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div>
<p>${esc(t(lang, 'dLimitsAfter'))}</p></section>
<section aria-labelledby="l-h"><h2 id="l-h">${esc(t(lang, 'dLicense'))}</h2><p>${esc(t(lang, 'dLicenseP1'))} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>${esc(t(lang, 'dLicenseP2'))} <b>scamdb.dev · CC BY 4.0</b> ${esc(t(lang, 'dLicenseP3'))}</p></section>
<section aria-labelledby="p-h"><h2 id="p-h">${esc(t(lang, 'dLimits'))}</h2><p>${esc(t(lang, 'dLimitsP'))}</p></section>
<section aria-labelledby="n-h"><h2 id="n-h">${esc(t(lang, 'dNext'))}</h2><ul class="list"><li>${esc(t(lang, 'dNext1'))}</li><li>${esc(t(lang, 'dNext2'))}</li><li>${esc(t(lang, 'dNext3'))}</li></ul></section>`;
  return layout({ title: t(lang, 'docsTitle'), description: t(lang, 'docsDesc'), body, path: '/docs/', meta, lang });
}
