// /report/: tell us about a scam. Works without an account (Turnstile check) or signed in (no check, screenshots too).
// The page is static; report.js sends the form to POST /v1/reports. Personal data is removed before anything is stored.
import { esc } from './html.js';
import { layout } from './layout.js';
import { UI_ICONS } from './icons.js';
import { t } from '../i18n.js';

export const TURNSTILE_SITE_KEY = '0x4AAAAAAGDLu7AgNxGk9rUm'; // public site key (the widget's hostnames include scamdb.dev)
const CHANNELS = ['whatsapp', 'sms', 'phone', 'email', 'social', 'online', 'in-person'];
const KEYS = ['repSending', 'repThanks', 'repThanksP', 'repAnother', 'repFail', 'repNeedText', 'repNeedCountry', 'repTurnstile', 'repTooMany',
  'repShotSignedOut', 'repUnreadable', 'repSignedIn', 'repCheckFirst'];

export function report({ repo, meta, lang = 'en' }) {
  const s = (k) => t(lang, k);
  const strings = Object.fromEntries(KEYS.map((k) => [k, s(k)]));
  const countries = repo.countries.map((c) => `<option value="${esc(c.code)}">${esc(c.name.en)}</option>`).join('');
  const channels = CHANNELS.map((c) => `<option value="${c}">${esc(s(`ch_${c.replace('-', '_')}`))}</option>`).join('');
  const body = `<section class="page-head"><h1>${esc(s('repH'))}</h1><p class="lede">${esc(s('repLede'))}</p></section>
<section class="report" id="rep" data-strings="${esc(JSON.stringify(strings))}" data-sitekey="${esc(TURNSTILE_SITE_KEY)}">
<form id="rep-form" novalidate>
  <p class="field-error" id="rep-err" role="alert" hidden></p>
  <div class="field"><label for="rep-country">${esc(s('repCountry'))}</label><select id="rep-country" name="country" required><option value="">${esc(s('repChoose'))}</option>${countries}</select></div>
  <div class="field"><label for="rep-channel">${esc(s('repChannel'))}</label><select id="rep-channel" name="channel"><option value="">${esc(s('repChannelAny'))}</option>${channels}</select></div>
  <div class="field"><label for="rep-text">${esc(s('repText'))}</label><textarea id="rep-text" name="text" rows="6" maxlength="5000" placeholder="${esc(s('repTextPh'))}"></textarea></div>
  <div class="field" id="rep-shot-field"><label for="rep-shot">${UI_ICONS.send}<span>${esc(s('repShot'))}</span></label><input type="file" id="rep-shot" name="image" accept="image/png,image/jpeg,image/webp"><p class="hint" id="rep-shot-hint">${esc(s('repShotSignedOut'))}</p></div>
  <div class="field"><label for="rep-what">${esc(s('repWhat'))}</label><textarea id="rep-what" name="whatHappened" rows="3" maxlength="2000" placeholder="${esc(s('repWhatPh'))}"></textarea></div>
  <div class="field"><label for="rep-contact">${esc(s('repContact'))}</label><input id="rep-contact" name="contact" maxlength="200" autocomplete="email" placeholder="${esc(s('repContactPh'))}"></div>
  <p class="hint privacy">${esc(s('repPrivacy'))}</p>
  <div id="rep-turnstile"></div>
  <button class="btn solid" type="submit" id="rep-send">${UI_ICONS.send}<span>${esc(s('repSend'))}</span></button>
</form>
<div id="rep-done" hidden><h2>${esc(s('repThanks'))}</h2><p>${esc(s('repThanksP'))}</p><p><a class="btn" href="/report/">${esc(s('repAnother'))}</a> <a class="btn" href="/#check">${esc(s('repCheckFirst'))}</a></p></div>
</section>`;
  return layout({ title: s('repTitle'), description: s('repDesc'), body, path: '/report/', meta, lang, scripts: '<script type="module" src="/assets/report.js"></script>' });
}
