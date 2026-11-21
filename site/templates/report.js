// /report/: tell us about a scam. Works without an account (Turnstile check) or signed in (no check, screenshots too).
// The page is static; report.js sends the form to POST /v1/reports. Personal data is removed before anything is stored.
import { esc } from './html.js';
import { layout } from './layout.js';
import { UI_ICONS } from './icons.js';
import { t } from '../i18n.js';

export const TURNSTILE_SITE_KEY = '0x4AAAAAAGEPmIAcW1_PP5dE'; // scamdb.dev's own widget (public site key; its secret is TURNSTILE_SECRET_SITE)
const CHANNELS = ['whatsapp', 'sms', 'phone', 'email', 'social', 'online', 'in-person'];
const KEYS = ['repCountryAuto', 'repSending', 'repThanks', 'repThanksP', 'repAnother', 'repFail', 'repNeedText', 'repNeedCountry', 'repTurnstile', 'repTooMany',
  'repShotSignedOut', 'repFailShot', 'repDrop', 'repDropOff', 'repUnreadable', 'repSignedIn', 'repCheckFirst'];

export function report({ repo, meta, lang = 'en' }) {
  const s = (k) => t(lang, k);
  const strings = Object.fromEntries(KEYS.map((k) => [k, s(k)]));
  const countries = repo.countries.map((c) => `<option value="${esc(c.code)}">${esc(c.name.en)}</option>`).join('');
  const channels = CHANNELS.map((c) => `<option value="${c}">${esc(s(`ch_${c.replace('-', '_')}`))}</option>`).join('');
  const body = `<section class="page-head"><h1>${esc(s('repH'))}</h1><p class="lede">${esc(s('repLede'))}</p></section>
<section class="report" id="rep" data-strings="${esc(JSON.stringify(strings))}" data-sitekey="${esc(TURNSTILE_SITE_KEY)}">
<form id="rep-form" novalidate>
  <p class="field-error" id="rep-err" role="alert" hidden></p>
  <div class="field"><label for="rep-text">${esc(s('repText'))}</label><textarea id="rep-text" name="text" rows="6" maxlength="5000" placeholder="${esc(s('repTextPh'))}"></textarea></div>
  <div class="field" id="rep-shot-field"><span class="flab">${esc(s('repShot'))}</span><label class="drop" for="rep-shot" id="rep-drop"><input type="file" id="rep-shot" name="image" accept="image/png,image/jpeg,image/webp"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="drop-main" id="rep-drop-main">${esc(s('repDrop'))}</span><span class="drop-sub">${esc(s('repDropTypes'))}</span></label><p class="hint" id="rep-shot-hint">${esc(s('repShotSignedOut'))}</p></div>
  <div id="rep-turnstile"></div>
  <button class="btn solid" type="submit" id="rep-send">${UI_ICONS.send}<span>${esc(s('repSend'))}</span></button>
  <details class="rep-more" id="rep-more"><summary>${esc(s('repMore'))} <span class="rep-more-sum" id="rep-more-sum"></span></summary>
  <div class="field"><label for="rep-country">${esc(s('repCountry'))}</label><select id="rep-country" name="country" data-guess><option value="">${esc(s('repCountryAuto'))}</option>${countries}</select></div>
  <div class="field"><label for="rep-channel">${esc(s('repChannel'))}</label><select id="rep-channel" name="channel"><option value="">${esc(s('repChannelAny'))}</option>${channels}</select></div>
  <div class="field"><label for="rep-outcome">${esc(s('repOutcome'))}</label><select id="rep-outcome" name="outcome"><option value="">${esc(s('repOutcomeAny'))}</option>${Object.entries(s('repOutcomes')).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></div>
  <div class="field"><label for="rep-what">${esc(s('repWhat'))}</label><textarea id="rep-what" name="whatHappened" rows="3" maxlength="2000" placeholder="${esc(s('repWhatPh'))}"></textarea></div>
  <div class="field"><label for="rep-contact">${esc(s('repContact'))}</label><input id="rep-contact" name="contact" maxlength="200" autocomplete="email" placeholder="${esc(s('repContactPh'))}"></div>
  </details>
  <p class="hint privacy">${esc(s('repPrivacy'))}</p>
</form>
<div id="rep-done" hidden><h2>${esc(s('repThanks'))}</h2><p>${esc(s('repThanksP'))}</p><p><a class="btn" href="/report/">${esc(s('repAnother'))}</a> <a class="btn" href="/#check">${esc(s('repCheckFirst'))}</a></p></div>
</section>`;
  return layout({ title: s('repTitle'), description: s('repDesc'), body, path: '/report/', meta, lang, scripts: '<script type="module" src="/assets/report.js"></script>' });
}
