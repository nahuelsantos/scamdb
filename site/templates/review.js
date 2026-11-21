// /review/: the owner's private review of what the source collector found (docs/sources.md). Static page; review.js
// fills it from /v1/review/items. Not linked from the site and kept out of search engines.
import { esc } from './html.js';
import { layout } from './layout.js';
import { UI_ICONS } from './icons.js';
import { t } from '../i18n.js';

const KEYS = ['revNew', 'revUseful', 'revSkip', 'revSkipped', 'revOpen', 'revBack', 'revMore', 'revLess', 'revEmpty', 'revFail', 'revLoadMore', 'revScore', 'revNotReviewer', 'revSetup'];
const ICONS = ['check', 'skip', 'external', 'replace'];

export function review({ meta, lang = 'en' }) {
  const s = (k) => t(lang, k);
  const strings = Object.fromEntries(KEYS.map((k) => [k, s(k)]));
  const icons = Object.fromEntries(ICONS.map((k) => [k, UI_ICONS[k]]));
  const tab = (status, label) => `<button type="button" class="rv-tab" role="tab" data-status="${status}" aria-selected="false">${esc(label)} <span class="rv-n" data-count="${status}"></span></button>`;
  const body = `<section class="page-head"><h1>${esc(s('revH'))}</h1></section>
<section class="review" id="rv" data-strings="${esc(JSON.stringify(strings))}" data-icons="${esc(JSON.stringify(icons))}">
  <p class="field-error" id="rv-err" role="alert" hidden></p>
  <div id="rv-out" class="acc-block" hidden>
    <p class="lede">${esc(s('revOut'))}</p>
    <a class="btn solid" href="/auth/github?next=/review/">${UI_ICONS.github}<span>${esc(s('revSignIn'))}</span></a>
  </div>
  <div id="rv-in" hidden>
    <div class="rv-tabs" role="tablist">${tab('new', s('revNew'))}${tab('useful', s('revUseful'))}${tab('skip', s('revSkipped'))}</div>
    <ol class="rv-list" id="rv-list"></ol>
    <p class="small" id="rv-empty" hidden>${esc(s('revEmpty'))}</p>
    <button type="button" class="btn" id="rv-more" hidden>${esc(s('revLoadMore'))}</button>
  </div>
</section>`;
  return layout({ title: s('revTitle'), description: s('revDesc'), body, path: '/review/', meta, lang, noindex: true,
    scripts: '<script type="module" src="/assets/review.js"></script>' });
}
