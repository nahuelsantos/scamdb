// /account/: sign in with GitHub and manage the API key. The page is static; account.js fills it from /v1/keys/me.
import { esc } from './html.js';
import { layout } from './layout.js';
import { t } from '../i18n.js';

const KEYS = ['accGithubError', 'accLoading', 'accFail', 'accSignedIn', 'accNoKey', 'accHasKey', 'accCreate', 'accReplace', 'accNew', 'accCopy',
  'accCopied', 'accUsage', 'accDelete', 'accSignOut', 'accReplaceConfirm'];

export function account({ meta, lang = 'en' }) {
  const strings = Object.fromEntries(KEYS.map((k) => [k, t(lang, k)]));
  const body = `<section class="page-head"><h1>${esc(t(lang, 'accH'))}</h1></section>
<section class="account" id="acc" data-strings="${esc(JSON.stringify(strings))}" aria-live="polite">
  <div id="acc-out">
    <p class="lede">${esc(t(lang, 'accOut'))}</p>
    <p class="field-error" id="acc-err" hidden>${esc(t(lang, 'accGithubError'))}</p>
    <a class="btn solid" href="/auth/github">${esc(t(lang, 'accSignIn'))}</a>
  </div>
  <div id="acc-in" hidden>
    <p><span>${esc(t(lang, 'accSignedIn'))}</span> <b id="acc-login"></b></p>
    <p id="acc-key"></p>
    <div class="newkey" id="acc-new" hidden><p>${esc(t(lang, 'accNew'))}</p><code id="acc-new-key" class="sel"></code> <button class="btn" type="button" id="acc-copy">${esc(t(lang, 'accCopy'))}</button></div>
    <p id="acc-usage"></p>
    <div class="btns"><button class="btn solid" type="button" id="acc-create"></button><button class="btn" type="button" id="acc-delete" hidden>${esc(t(lang, 'accDelete'))}</button></div>
    <form method="post" action="/auth/logout"><button class="btn" type="submit">${esc(t(lang, 'accSignOut'))}</button></form>
  </div>
</section>`;
  return layout({ title: t(lang, 'accTitle'), description: t(lang, 'accDesc'), body, path: '/account/', meta, lang,
    scripts: '<script type="module" src="/assets/account.js"></script>' });
}
