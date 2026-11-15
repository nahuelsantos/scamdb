import { layout, REPO } from './layout.js';

export function contribute({ meta }) {
  const body = `<section class="page-head"><h1>Contribute</h1><p class="lede">Every scam is one file on GitHub. Anyone can add one or fix one; a maintainer reviews every change before it goes live.</p></section>
<section aria-labelledby="a-h"><h2 id="a-h">Add or fix a scam</h2><ol class="list">
<li>Read <a href="${REPO}/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>: the fields and the rules.</li>
<li>Create or edit <code>data/&lt;country&gt;/scams/&lt;slug&gt;.json</code>. Copy an existing entry to start.</li>
<li>Run <code>npm run validate</code>, then open a pull request.</li></ol>
<p>The rules that matter most: every scam has dated <code>https://</code> sources; examples are invented and links are written <code>[enlace]</code>; no personal data; media is linked, never copied.</p>
<p>By opening a pull request you agree that your contribution is published under CC BY 4.0 (data) or MIT (code).</p></section>
<section aria-labelledby="r-h"><h2 id="r-h">Report a scam you received</h2><p>A private report form is coming soon. Until then, <a href="${REPO}/issues/new">open an issue</a> describing it <b>without any personal data</b>: no names, numbers or screenshots of real people.</p></section>`;
  return layout({ title: 'Contribute · scamdb', description: 'Add a scam to scamdb or fix one, through GitHub.', body, path: '/contribute/', meta });
}
