import { esc } from './html.js';
import { layout, REPO } from './layout.js';
import { t } from '../i18n.js';

const PATHS = ['/v1/index.json', '/v1/countries.json', '/v1/signals.json', '/v1/{country}/scams.json', '/v1/{country}/contacts.json',
  '/v1/scams/{country}/{slug}.json', '/v1/scams.json', '/v1/scamdb.zip', '/v1/changes.json'];
const REPORT_FIELDS = ['text', 'whatHappened', 'country', 'channel', 'contact', 'source', 'turnstileToken'];
const FIELDS = ['id', 'country', 'status', 'channels', 'sender', 'name', 'how', 'steps[]', 'examples[]', 'phrases', 'signals[]', 'redFlags',
  'whatToDo', 'reportTo[]', 'sources[]', 'media[]', 'story', 'related[]', 'firstSeen', 'updated'];

export function docs({ repo, meta, lang = 'en' }) {
  const rows = t(lang, 'endpointRows'), fields = t(lang, 'fieldRows');
  const sample = repo.entries.find((e) => e.id === 'ar/whatsapp-codigo') ?? repo.entries[0];
  const short = sample && JSON.stringify({ license: 'CC BY 4.0', attribution: 'scamdb.dev · CC BY 4.0', version: meta.version,
    data: { id: sample.id, country: sample.country, name: sample.name, signals: sample.signals, '…': '…' } }, null, 2);
  const body = `<section class="page-head"><h1>${esc(t(lang, 'navDocs'))}</h1><p class="lede">${esc(t(lang, 'docsLede'))} <code>{"es": "…"}</code>.</p></section>
<section aria-labelledby="q-h"><h2 id="q-h">${esc(t(lang, 'dQuick'))}</h2><pre class="code"><code>curl https://scamdb.dev/v1/ar/scams.json</code></pre>
<pre class="code"><code>const res = await fetch('https://scamdb.dev/v1/ar/scams.json');
const { data, version } = await res.json();
console.log(data.length, 'scams, dataset', version);</code></pre></section>
<section aria-labelledby="e-h"><h2 id="e-h">${esc(t(lang, 'dEndpoints'))}</h2><div class="scroll"><table><thead><tr><th>GET</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${PATHS.map((p, i) => `<tr><td><code>${esc(p)}</code></td><td>${esc(rows[i])}</td></tr>`).join('')}</tbody></table></div></section>
<section aria-labelledby="r-h"><h2 id="r-h">${esc(t(lang, 'dResponse'))}</h2><p>${esc(t(lang, 'dResponseP'))}</p>
<pre class="code"><code>${esc(short)}</code></pre></section>
<section aria-labelledby="f-h"><h2 id="f-h">${esc(t(lang, 'dEntry'))}</h2><div class="scroll"><table><thead><tr><th>${esc(t(lang, 'dField'))}</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(fields[i])}</td></tr>`).join('')}</tbody></table></div>
<p>${esc(t(lang, 'dSchemas'))} <a href="${REPO}/tree/main/schema">schema/</a>.</p></section>
<section aria-labelledby="rep-h"><h2 id="rep-h">${esc(t(lang, 'dReports'))}</h2><p>${esc(t(lang, 'dReportsP'))}</p>
<pre class="code"><code>curl -X POST https://scamdb.dev/v1/reports \\
  -H "Authorization: Bearer sk_…" -H "Content-Type: application/json" \\
  -d '{"text": "Le hablo de PAMI…", "country": "ar", "channel": "phone", "source": "my-app"}'
# → 201 {"id": "…", "received": true}</code></pre>
<div class="scroll"><table><thead><tr><th>POST /v1/reports</th><th>${esc(t(lang, 'dWhat'))}</th></tr></thead><tbody>
${REPORT_FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(t(lang, 'dReportsRows')[i])}</td></tr>`).join('')}</tbody></table></div>
<p>${esc(t(lang, 'dReportsKeyless'))}</p></section>
<section aria-labelledby="k-h"><h2 id="k-h">${esc(t(lang, 'dKeys'))}</h2><p>${esc(t(lang, 'dKeysP'))}</p></section>
<section aria-labelledby="l-h"><h2 id="l-h">${esc(t(lang, 'dLicense'))}</h2><p>${esc(t(lang, 'dLicenseP1'))} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>${esc(t(lang, 'dLicenseP2'))} <b>scamdb.dev · CC BY 4.0</b> ${esc(t(lang, 'dLicenseP3'))}</p></section>
<section aria-labelledby="p-h"><h2 id="p-h">${esc(t(lang, 'dLimits'))}</h2><p>${esc(t(lang, 'dLimitsP'))}</p></section>
<section aria-labelledby="n-h"><h2 id="n-h">${esc(t(lang, 'dNext'))}</h2><ul class="list"><li>${esc(t(lang, 'dNext1'))}</li><li>${esc(t(lang, 'dNext2'))}</li><li><code>POST /v1/isitascam</code>: ${esc(t(lang, 'dNext3'))}</li></ul></section>`;
  return layout({ title: t(lang, 'docsTitle'), description: t(lang, 'docsDesc'), body, path: '/docs/', meta, lang });
}
