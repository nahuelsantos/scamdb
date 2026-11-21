// The report form: signed in with a key → no captcha, screenshots allowed; otherwise a Turnstile check. Sends to
// POST /v1/reports with X-Requested-With: scamdb (so the session key is used on our own site). Every server value is
// shown with textContent. A message handed over from a check (sessionStorage 'scamdb:report') prefills the form.
const root = document.getElementById('rep');
const S = JSON.parse(root.dataset.strings || '{}');
const $ = (id) => document.getElementById(id);
const form = $('rep-form'), err = $('rep-err'), send = $('rep-send');
let signedIn = false, token = '', widget = null;

const fail = (msg) => { err.textContent = msg; err.hidden = false; err.scrollIntoView({ block: 'center' }); };

// Prefill: from a check on the home page or a catalogue page (country only). Never put message text in the URL.
try {
  const handoff = JSON.parse(sessionStorage.getItem('scamdb:report') || 'null');
  if (handoff) {
    if (handoff.text) $('rep-text').value = String(handoff.text).slice(0, 5000);
    if (handoff.country) $('rep-country').value = handoff.country;
    sessionStorage.removeItem('scamdb:report');
  }
} catch { /* storage blocked: start empty */ }
const cc = new URLSearchParams(location.search).get('country');
if (cc && !$('rep-country').value) $('rep-country').value = cc;

// The country, guessed from the browser's language settings ("es-ES" → Spain, "pt-BR" → Brazil). If none fits, it stays
// "Detect it for me" and the server uses the country the request comes from. Shown next to "Add details".
export function guessCountry(languages, available) {
  for (const l of languages ?? []) {
    const region = String(l).split('-')[1]?.toLowerCase();
    if (region && available.has(region)) return region;
  }
  return '';
}
const sel = $('rep-country');
if (!sel.value) sel.value = guessCountry(navigator.languages ?? [navigator.language], new Set([...sel.options].map((o) => o.value).filter(Boolean)));
const showCountry = () => { $('rep-more-sum').textContent = sel.value ? `· ${sel.options[sel.selectedIndex].text}` : ''; };
sel.addEventListener('change', showCountry);
showCountry();

function loadTurnstile() {
  if (document.querySelector('script[data-turnstile]')) return;
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async = true; s.dataset.turnstile = '1';
  s.onload = () => {
    widget = window.turnstile?.render('#rep-turnstile', { sitekey: root.dataset.sitekey, callback: (t) => { token = t; }, 'expired-callback': () => { token = ''; } });
  };
  document.head.appendChild(s);
}

async function whoAmI() {
  try {
    const r = await fetch('/v1/keys/me', { credentials: 'same-origin' });
    if (r.ok) { const me = await r.json(); signedIn = Boolean(me.hasKey); }
  } catch { /* offline or not set up: anonymous */ }
  $('rep-shot').disabled = !signedIn;
  $('rep-drop').classList.toggle('off', !signedIn);
  if (!signedIn) $('rep-drop-main').textContent = S.repDropOff;
  $('rep-shot-hint').textContent = signedIn ? S.repSignedIn : S.repShotSignedOut;
  if (!signedIn) loadTurnstile();
}
whoAmI();

// Phone screenshots are often 1-4 MB; the server turns the image into text and must encode all of it, which can run
// past a Worker's CPU limit. Text stays readable at 1080 px wide, so shrink it here first (about 200-400 KB as JPEG).
// Any failure (old browser, odd file) sends the original instead.
export async function shrinkImage(file, { maxWidth = 1080, maxHeight = 3200, quality = 0.85 } = {}) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bmp.width, maxHeight / bmp.height);
    if (scale === 1 && file.size < 600 * 1024) return file;
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // transparent PNGs become white, not black, as JPEG
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((done) => canvas.toBlob(done, 'image/jpeg', quality));
    return blob && blob.size < file.size ? new File([blob], 'screenshot.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

// Screenshot drop zone: drag a file onto it or click to pick one.
const drop = $('rep-drop'), shotIn = $('rep-shot');
const showFile = () => { const f = shotIn.files?.[0]; $('rep-drop-main').textContent = f ? f.name : S.repDrop; drop.classList.toggle('has', Boolean(f)); };
shotIn.addEventListener('change', showFile);
for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, (e) => { e.preventDefault(); if (!shotIn.disabled) drop.classList.add('over'); });
for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (shotIn.disabled || !f || !/^image\/(png|jpeg|webp)$/.test(f.type)) return;
  const dt = new DataTransfer(); dt.items.add(f); shotIn.files = dt.files; showFile();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.hidden = true;
  const country = $('rep-country').value;
  const text = $('rep-text').value.trim(), what = $('rep-what').value.trim();
  const shot = $('rep-shot').files?.[0];
  if (!text && !what && !shot) return fail(S.repNeedText);
  if (!signedIn && !token) return fail(S.repTurnstile);

  const fields = { country: country || undefined, channel: $('rep-channel').value || undefined, outcome: $('rep-outcome').value || undefined, whatHappened: what || undefined, contact: $('rep-contact').value.trim() || undefined, source: 'scamdb.dev' };
  if (!signedIn) fields.turnstileToken = token;
  let body, headers = { 'x-requested-with': 'scamdb' };
  if (shot && signedIn) {
    body = new FormData();
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) body.append(k, v);
    body.append('image', await shrinkImage(shot));
  } else {
    body = JSON.stringify({ ...fields, text: text || undefined });
    headers['content-type'] = 'application/json';
  }
  send.disabled = true;
  send.querySelector('span').textContent = S.repSending;
  try {
    const r = await fetch('/v1/reports', { method: 'POST', credentials: 'same-origin', headers, body });
    if (r.status === 201) { form.hidden = true; $('rep-done').hidden = false; $('rep-done').scrollIntoView({ block: 'center' }); return; }
    const b = await r.json().catch(() => null);
    // No JSON body means the request failed before our code could answer (for example a CPU or time limit).
    fail(r.status === 429 ? S.repTooMany : r.status === 403 ? S.repTurnstile : r.status === 422 ? S.repUnreadable
      : b?.message ? b.message : `${shot ? S.repFailShot : S.repFail} (${r.status})`);
  } catch {
    fail(S.repFail);
  } finally {
    send.disabled = false;
    send.querySelector('span').textContent = form.dataset.sendLabel || send.querySelector('span').textContent;
    if (widget !== null && !signedIn) { window.turnstile?.reset(widget); token = ''; }
  }
});
form.dataset.sendLabel = send.querySelector('span').textContent;
