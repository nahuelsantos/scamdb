import { esc } from './html.js';
import { layout, REPO } from './layout.js';

const ROWS = [
  ['/v1/index.json', 'Dataset version, build date, countries, counts'],
  ['/v1/countries.json', 'Countries and their languages'],
  ['/v1/signals.json', 'The warning-sign vocabulary'],
  ['/v1/{country}/scams.json', 'Every entry for a country'],
  ['/v1/{country}/contacts.json', 'Who to report to in that country'],
  ['/v1/scams/{country}/{slug}.json', 'One entry'],
  ['/v1/scams.json', 'Every entry, all countries'],
  ['/v1/scamdb.zip', 'The full dataset as a download'],
  ['/v1/changes.json', 'Recent additions and edits, newest first'],
];
const FIELDS = [
  ['id', '<country>/<slug>'], ['country', 'ISO 3166-1 alpha-2, lowercase'], ['status', 'active · fading · archived'],
  ['channels', 'whatsapp · sms · phone · online · in-person · email · social'], ['sender', 'who the message claims to be'],
  ['name', 'short recognisable name'], ['how', 'how it works, 3–4 sentences'], ['steps[]', '{ text, signal? }: the script, step by step'],
  ['examples[]', '{ text, channel? }: invented sample messages'], ['phrases', 'everyday phrases people use to describe it (≥ 5 per language)'],
  ['signals[]', 'ids from /v1/signals.json'], ['redFlags', 'warning signs in plain words'], ['whatToDo', 'what to do, in plain words'],
  ['reportTo[]', 'contact ids from /v1/{country}/contacts.json'], ['sources[]', '{ title, publisher, url, date }'],
  ['media[]', '{ type, url, title, publisher, date }: links, never copies (optional)'], ['story', 'a real anonymous case (optional)'],
  ['related[]', 'ids of related scams (optional)'], ['firstSeen', 'YYYY-MM (optional)'], ['updated', 'YYYY-MM-DD'],
];

export function docs({ repo, meta }) {
  const sample = repo.entries.find((e) => e.id === 'ar/whatsapp-codigo') ?? repo.entries[0];
  const short = sample && JSON.stringify({ license: 'CC BY 4.0', attribution: 'scamdb.dev · CC BY 4.0', version: meta.version,
    data: { id: sample.id, country: sample.country, name: sample.name, signals: sample.signals, '…': '…' } }, null, 2);
  const body = `<section class="page-head"><h1>Docs</h1><p class="lede">Static JSON over HTTPS. No key, no limit, CORS open. Text fields are objects keyed by language, like <code>{"es": "…"}</code>.</p></section>
<section aria-labelledby="q-h"><h2 id="q-h">Quickstart</h2><pre class="code"><code>curl https://scamdb.dev/v1/ar/scams.json</code></pre>
<pre class="code"><code>const res = await fetch('https://scamdb.dev/v1/ar/scams.json');
const { data, version } = await res.json();
console.log(data.length, 'scams, dataset', version);</code></pre></section>
<section aria-labelledby="e-h"><h2 id="e-h">Endpoints</h2><div class="scroll"><table><thead><tr><th>GET</th><th>What</th></tr></thead><tbody>
${ROWS.map(([p, w]) => `<tr><td><code>${esc(p)}</code></td><td>${esc(w)}</td></tr>`).join('')}</tbody></table></div></section>
<section aria-labelledby="r-h"><h2 id="r-h">The response</h2><p>Every JSON file is wrapped in the same envelope. <code>version</code> is the date and commit of the dataset; it changes on every edit.</p>
<pre class="code"><code>${esc(short)}</code></pre></section>
<section aria-labelledby="f-h"><h2 id="f-h">An entry</h2><div class="scroll"><table><thead><tr><th>Field</th><th>What</th></tr></thead><tbody>
${FIELDS.map(([f, w]) => `<tr><td><code>${esc(f)}</code></td><td>${esc(w)}</td></tr>`).join('')}</tbody></table></div>
<p>JSON Schemas are in the repo under <a href="${REPO}/tree/main/schema">schema/</a>.</p></section>
<section aria-labelledby="l-h"><h2 id="l-h">License and attribution</h2><p>The data is <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: use it for anything, including commercially, as long as you credit <b>scamdb.dev · CC BY 4.0</b> and link to the license. Sources and media linked from entries belong to their owners.</p></section>
<section aria-labelledby="p-h"><h2 id="p-h">Limits and privacy</h2><p>Static endpoints have no key and no limit. They are cached for 5 minutes. We keep no logs of who reads the data beyond what our host keeps to serve it.</p></section>
<section aria-labelledby="n-h"><h2 id="n-h">Coming next</h2><ul class="list"><li>Private reports: tell us about a scam you received.</li><li>Free API keys.</li><li><code>POST /v1/isitascam</code>: send a message, screenshot or voice note and get a verdict, the warning signs and the matching scam.</li></ul></section>`;
  return layout({ title: 'Docs · scamdb', description: 'How to use the scamdb API: endpoints, the entry format, license and attribution.', body, path: '/docs/', meta });
}
