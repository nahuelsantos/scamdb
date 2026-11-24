import { esc } from './html.js';
import { layout, REPO } from './layout.js';
import { t } from '../i18n.js';

const PATHS = ['/v1/index.json', '/v1/countries.json', '/v1/signals.json', '/v1/{country}/scams.json', '/v1/{country}/contacts.json',
  '/v1/scams/{country}/{slug}.json', '/v1/scams.json', '/v1/scamdb.zip', '/v1/scams.csv', '/v1/changes.json', '/v1/changes.atom', '/v1/brands.json'];
const REPORT_FIELDS = ['text', 'whatHappened', 'country', 'channel', 'outcome', 'contact', 'source', 'turnstileToken'];
const CHECK_FIELDS = ['text', 'country', 'lang', 'report', 'wait', 'image', 'audio'];
const CHECK_EXAMPLE = JSON.stringify({ verdict: 'scam', score: null, signals: [{ id: 'asks_for_code', label: 'Asks for a code', evidence: 'read me the 6-digit code' }],
  matches: [{ id: 'nz/bank-fraud-team-call', name: 'Fake bank fraud team', url: 'https://scamdb.dev/v1/scams/nz/bank-fraud-team-call.json', page: 'https://scamdb.dev/catalogue/nz/bank-fraud-team-call/' }],
  whatToDo: ['Hang up and call your bank on the number on your card.'], reportTo: 'https://scamdb.dev/v1/nz/contacts.json', engine: { matcher: '1.2.0', scorer: 'matcher' }, datasetVersion: '…' }, null, 2);
const FIELDS = ['id', 'country', 'lang', 'status', 'channels', 'sender', 'name', 'how', 'steps[]', 'examples[]', 'phrases', 'signals[]', 'redFlags',
  'whatToDo', 'reportTo[]', 'sources[]', 'media[]', 'story', 'related[]', 'firstSeen', 'updated'];

/** Code examples in tabs (curl, JavaScript, Python). Without JS every version shows, each with its label. */
function codeTabs(id, versions) {
  const names = { curl: 'curl', js: 'JavaScript', py: 'Python' };
  const keys = Object.keys(versions);
  return `<div class="ctabs" data-ctabs><div class="ctabs-bar" role="tablist" aria-label="Language" hidden>${keys.map((k, i) => `<button type="button" role="tab" id="${id}-${k}-t" aria-controls="${id}-${k}" aria-selected="${i === 0}" data-lang-tab="${k}">${names[k]}</button>`).join('')}</div>
${keys.map((k) => `<div class="ctab" id="${id}-${k}" role="tabpanel" aria-labelledby="${id}-${k}-t"><p class="ctab-name">${names[k]}</p><pre class="code"><code>${esc(versions[k])}</code></pre></div>`).join('')}</div>`;
}

const Q = {
  curl: 'curl https://scamdb.dev/v1/us/scams.json',
  js: "const res = await fetch('https://scamdb.dev/v1/us/scams.json');\nconst { data, version } = await res.json();\nconsole.log(data.length, 'scams, dataset', version);",
  py: 'import requests\n\nbody = requests.get("https://scamdb.dev/v1/us/scams.json").json()\nprint(len(body["data"]), "scams, dataset", body["version"])',
};
const CHECK = {
  curl: 'curl -X POST https://scamdb.dev/v1/isitascam \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "This is the fraud team of your bank, read me the 6-digit code", "lang": "en", "country": "us"}\'',
  js: "const res = await fetch('https://scamdb.dev/v1/isitascam', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SCAMDB_KEY}` },\n  body: JSON.stringify({ text: 'This is the fraud team of your bank, read me the 6-digit code', lang: 'en', country: 'us' }),\n});\nconst { verdict, signals, matches } = await res.json();",
  py: 'import os, requests\n\nanswer = requests.post(\n    "https://scamdb.dev/v1/isitascam",\n    headers={"Authorization": f"Bearer {os.environ[\'SCAMDB_KEY\']}"},\n    json={"text": "This is the fraud team of your bank, read me the 6-digit code", "lang": "en", "country": "us"},\n).json()\nprint(answer["verdict"], answer["signals"])',
};
const CHECK_IMAGE = 'curl -X POST https://scamdb.dev/v1/isitascam \\\n  -H "Authorization: Bearer sk_…" \\\n  -F image=@screenshot.png -F lang=en';
const REPORT = {
  curl: 'curl -X POST https://scamdb.dev/v1/reports \\\n  -H "Authorization: Bearer sk_…" -H "Content-Type: application/json" \\\n  -d \'{"text": "Bank Fraud Alert: did you attempt a Zelle payment…", "country": "us", "channel": "sms", "source": "my-app"}\'\n# → 201 {"id": "…", "received": true}',
  js: "await fetch('https://scamdb.dev/v1/reports', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SCAMDB_KEY}` },\n  body: JSON.stringify({ text: 'Bank Fraud Alert: did you attempt a Zelle payment…', country: 'us', channel: 'sms', source: 'my-app' }),\n}); // → 201 { id, received: true }",
  py: 'requests.post(\n    "https://scamdb.dev/v1/reports",\n    headers={"Authorization": f"Bearer {os.environ[\'SCAMDB_KEY\']}"},\n    json={"text": "Bank Fraud Alert: did you attempt a Zelle payment…", "country": "us", "channel": "sms", "source": "my-app"},\n)  # → 201 {"id": "…", "received": true}',
};

export function docs({ repo, meta, lang = 'en' }) {
  const rows = t(lang, 'endpointRows'), fields = t(lang, 'fieldRows');
  const sample = repo.entries.find((e) => e.id === 'us/bank-fraud-alert-zelle') ?? repo.entries[0];
  const short = sample && JSON.stringify({ license: 'CC BY 4.0', attribution: 'scamdb.dev · CC BY 4.0', version: meta.version,
    data: { id: sample.id, country: sample.country, lang: sample.lang, name: sample.name, signals: sample.signals, '…': '…' } }, null, 2);
  const table = (head, list) => `<div class="scroll"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${list.join('')}</tbody></table></div>`;
  // The sections, in the order a developer needs them, grouped for the side menu.
  const S = [
    ['start', 'quick', t(lang, 'dQuick'), codeTabs('q', Q)],
    ['start', 'keys', t(lang, 'dKeys'), `<p>${esc(t(lang, 'dKeysP'))} <a href="/account/">${esc(t(lang, 'dGetKey'))}</a>.</p>
${table(t(lang, 'dLimitsCols'), t(lang, 'dLimitsRows').map(([e, a, b]) => `<tr><td><code>${esc(e)}</code></td><td>${esc(a)}</td><td>${esc(b)}</td></tr>`))}
<p>${esc(t(lang, 'dLimitsAfter'))}</p>`],
    ['check', 'isitascam', t(lang, 'dCheck'), `<p>${esc(t(lang, 'dCheckP'))}</p>${codeTabs('c', CHECK)}
<p class="ctab-name">${esc(t(lang, 'dCheckImage'))}</p><pre class="code"><code>${esc(CHECK_IMAGE)}</code></pre>
${table(['POST /v1/isitascam', t(lang, 'dWhat')], CHECK_FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(t(lang, 'dCheckRows')[i])}</td></tr>`))}
<p class="ctab-name">${esc(t(lang, 'dAnswer'))}</p><pre class="code"><code>${esc(CHECK_EXAMPLE)}</code></pre>
<ul class="list">${t(lang, 'dCheckNotes').map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
<h3 id="how-h">${esc(t(lang, 'dHow'))}</h3><ol class="list">${t(lang, 'dHowSteps').map((n) => `<li>${esc(n)}</li>`).join('')}</ol>
<p>${esc(t(lang, 'dHowMore'))} <a href="${REPO}/blob/main/docs/detection.md">docs/detection.md</a>.</p>`],
    ['check', 'reports', t(lang, 'dReports'), `<p>${esc(t(lang, 'dReportsP'))}</p>${codeTabs('r', REPORT)}
${table(['POST /v1/reports', t(lang, 'dWhat')], REPORT_FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(t(lang, 'dReportsRows')[i])}</td></tr>`))}
<p>${esc(t(lang, 'dReportsKeyless'))}</p>`],
    ['data', 'endpoints', t(lang, 'dEndpoints'), table(['GET', t(lang, 'dWhat')], PATHS.map((p, i) => `<tr><td><code>${esc(p)}</code></td><td>${esc(rows[i])}</td></tr>`))],
    ['data', 'response', t(lang, 'dResponse'), `<p>${esc(t(lang, 'dResponseP'))}</p><pre class="code"><code>${esc(short)}</code></pre>`],
    ['data', 'fields', t(lang, 'dEntry'), `${table([t(lang, 'dField'), t(lang, 'dWhat')], FIELDS.map((f, i) => `<tr><td><code>${esc(f)}</code></td><td>${esc(fields[i])}</td></tr>`))}
<p>${esc(t(lang, 'dSchemas'))} <a href="${REPO}/tree/main/schema">schema/</a>.</p>`],
    ['data', 'downloads', t(lang, 'dDownloadH'), `<p>${esc(t(lang, 'dDownloadP'))}</p><ul class="list">${t(lang, 'dDownloadRows').map((r) => { const [path, ...rest] = r.split(': '); return `<li><a href="${esc(path)}"><code>${esc(path)}</code></a>: ${esc(rest.join(': '))}</li>`; }).join('')}</ul>`],
    ['data', 'feed', t(lang, 'feedH'), `<p>${esc(t(lang, 'dFeedP'))} <a href="/feed/">/feed/</a></p>`],
    ['about', 'license', t(lang, 'dLicense'), `<p>${esc(t(lang, 'dLicenseP1'))} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>${esc(t(lang, 'dLicenseP2'))} <b>scamdb.dev · CC BY 4.0</b> ${esc(t(lang, 'dLicenseP3'))}</p>`],
    ['about', 'limitations', t(lang, 'dLimits'), `<p>${esc(t(lang, 'dLimitsP'))}</p>`],
    ['about', 'contribute', t(lang, 'navContribute'), `<p>${esc(t(lang, 'dContribP'))} <a href="/contribute/">${esc(t(lang, 'dContribLink'))}</a>.</p>`],
    ['about', 'next', t(lang, 'dNext'), `<ul class="list"><li>${esc(t(lang, 'dNext1'))}</li><li>${esc(t(lang, 'dNext2'))}</li><li>${esc(t(lang, 'dNext3'))}</li></ul>`],
  ];
  const groups = t(lang, 'dGroups');
  const menu = Object.keys(groups).map((g) => `<p class="docs-group">${esc(groups[g])}</p><ul>${S.filter((x) => x[0] === g).map(([, id, title]) => `<li><a href="#${id}">${esc(title)}</a></li>`).join('')}</ul>`).join('');
  const body = `<div class="docs">
<nav class="docs-nav" aria-label="${esc(t(lang, 'dMenu'))}"><details class="docs-menu"><summary>${esc(t(lang, 'dMenu'))}</summary>${menu}</details><div class="docs-side">${menu}</div></nav>
<div class="docs-body">
<section class="page-head"><h1>${esc(t(lang, 'navDocs'))}</h1><p class="lede">${esc(t(lang, 'docsLede'))} <code>{"en": "…", "es": "…"}</code>.</p></section>
${S.map(([, id, title, html]) => `<section id="${id}" aria-labelledby="${id}-h"><h2 id="${id}-h"><a class="anchor" href="#${id}">${esc(title)}</a></h2>${html}</section>`).join('\n')}
</div></div>`;
  return layout({ title: t(lang, 'docsTitle'), description: t(lang, 'docsDesc'), body, path: '/docs/', meta, lang,
    scripts: '<script type="module" src="/assets/docs.js"></script>' });
}
