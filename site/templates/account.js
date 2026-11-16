// /account/: sign in with GitHub and manage the API key. The page is static; account.js fills it from /v1/keys/me.
import { esc } from './html.js';
import { layout } from './layout.js';
import { UI_ICONS } from './icons.js';
import { t } from '../i18n.js';

const KEYS = ['accGithubError', 'accLoading', 'accFail', 'accSignedIn', 'accNoKey', 'accCreate', 'accReplace', 'accCopy',
  'accCopied', 'accUsage', 'accDelete', 'accSignOut', 'accReplaceConfirm', 'accDeleteConfirm', 'accSetup', 'accShow', 'accHide', 'accNotViewable'];
const iconBtn = (id, icon, label, extra = '') => `<button class="ibtn" type="button" id="${id}" aria-label="${esc(label)}" title="${esc(label)}"${extra}>${icon}</button>`;

export function account({ meta, lang = 'en' }) {
  const s = (k) => t(lang, k);
  const strings = Object.fromEntries(KEYS.map((k) => [k, s(k)]));
  const body = `<section class="page-head"><h1>${esc(s('accH'))}</h1></section>
<section class="account" id="acc" data-strings="${esc(JSON.stringify(strings))}" data-icons="${esc(JSON.stringify({ eye: UI_ICONS.eye, eyeOff: UI_ICONS.eyeOff }))}">
  <p class="field-error" id="acc-err" role="alert" hidden></p>
  <div id="acc-out" class="acc-block">
    <p class="lede">${esc(s('accOut'))}</p>
    <a class="btn solid" href="/auth/github">${UI_ICONS.github}<span>${esc(s('accSignIn'))}</span></a>
  </div>
  <div id="acc-in" class="acc-block" hidden>
    <p class="who">${UI_ICONS.github}<span class="sr">${esc(s('accSignedIn'))}</span> <b id="acc-login"></b></p>
    <div class="keyrow" id="acc-keyrow" hidden>
      <label class="label" for="acc-key">${UI_ICONS.key}<span>${esc(s('accKeyLabel'))}</span></label>
      <div class="secret">
        <input id="acc-key" type="password" readonly spellcheck="false" autocomplete="off">
        ${iconBtn('acc-eye', UI_ICONS.eye, s('accShow'), ' aria-pressed="false"')}
        ${iconBtn('acc-copy', UI_ICONS.copy, s('accCopy'))}
      </div>
      <p class="small" id="acc-hint" aria-live="polite"></p>
      <p class="small" id="acc-usage"></p>
      <div class="actions">${iconBtn('acc-replace', UI_ICONS.replace, s('accReplace'))}${iconBtn('acc-delete', UI_ICONS.trash, s('accDelete'))}</div>
    </div>
    <div id="acc-nokey" hidden>
      <p>${esc(s('accNoKey'))}</p>
      <button class="btn solid" type="button" id="acc-create">${UI_ICONS.key}<span>${esc(s('accCreate'))}</span></button>
    </div>
    <div class="signout">${iconBtn('acc-signout', UI_ICONS.signOut, s('accSignOut'))}</div>
  </div>
</section>`;
  return layout({ title: s('accTitle'), description: s('accDesc'), body, path: '/account/', meta, lang,
    scripts: '<script type="module" src="/assets/account.js"></script>' });
}
