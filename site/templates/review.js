// /review/: the owner's private review of what the source collector found (docs/sources.md). Static page; review.js
// fills it from /v1/review/items. Not linked from the site and kept out of search engines.
import { esc } from './html.js';
import { layout } from './layout.js';
import { UI_ICONS } from './icons.js';
import { t } from '../i18n.js';

const KEYS = ['revOn', 'revOff', 'revAll', 'revFailing', 'revSchedule', 'revLastRun', 'revNoRuns', 'revRunOk', 'revRunFailed', 'revPerSource', 'revKept', 'revOfKept', 'revNewInQueue', 'revSourcesRead', 'revNotRead', 'revHomeOnly', 'revNoFeed', 'revOffShort', 'revSite', 'revNoneFailing', 'revChangedHere', 'revChangedTitle', 'revOffChanged', 'revSwitchSetup', 'revNoFeedReason', 'revNeverOnReason', 'revNew', 'revUseful', 'revSkip', 'revSkipped', 'revOpen', 'revBack', 'revMore', 'revLess', 'revEmpty', 'revFail', 'revLoadMore', 'revScore', 'revNotReviewer', 'revSetup'];
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
    <nav class="rv-top" aria-label="${esc(s('revH'))}">
      <a href="#queue" data-view="queue">${esc(s('revTabQueue'))}</a><a href="#sources" data-view="sources">${esc(s('revTabSources'))}</a><a href="#runs" data-view="runs">${esc(s('revTabRuns'))}</a>
    </nav>
    <div id="rv-queue" data-panel="queue">
      <div class="rv-tabs" role="tablist">${tab('new', s('revNew'))}${tab('useful', s('revUseful'))}${tab('skip', s('revSkipped'))}</div>
      <ol class="rv-list" id="rv-list"></ol>
      <p class="small" id="rv-empty" hidden>${esc(s('revEmpty'))}</p>
      <button type="button" class="btn" id="rv-more" hidden>${esc(s('revLoadMore'))}</button>
    </div>
    <div id="rv-sources" data-panel="sources" hidden>
      <p class="rv-sum" id="rv-src-sum"></p>
      <div class="rv-tabs" role="tablist" id="rv-src-filter">${['all', 'on', 'off', 'failing'].map((f, i) => `<button type="button" class="rv-tab" role="tab" data-filter="${f}" aria-selected="${i === 0}">${esc(s({ all: 'revAll', on: 'revOn', off: 'revOff', failing: 'revFailing' }[f]))}</button>`).join('')}</div>
      <div id="rv-src-list"></div>
    </div>
    <div id="rv-runs" data-panel="runs" hidden>
      <p class="rv-sum">${esc(s('revSchedule'))}</p>
      <ol class="rv-list" id="rv-run-list"></ol>
    </div>
  </div>
</section>`;
  return layout({ title: s('revTitle'), description: s('revDesc'), body, path: '/review/', meta, lang, noindex: true,
    scripts: '<script type="module" src="/assets/review.js"></script>' });
}
