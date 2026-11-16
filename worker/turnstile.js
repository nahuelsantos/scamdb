// Cloudflare Turnstile check for keyless reports (scamdb.dev's report form and eschamuyo's, each with its own widget).
export async function verifyTurnstile(token, ip, secret) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    return (await r.json()).success === true;
  } catch { return false; }
}
