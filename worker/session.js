// Signed session cookies (HMAC-SHA256). The cookie holds { githubId, login, exp }; nothing secret.
const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hmacKey = (secret) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function sign(payload, secret) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

/** The payload, or null for a bad signature, bad JSON or a past `exp`. */
export async function verify(token, secret) {
  try {
    const [body, sig] = String(token).split('.');
    if (!body || !sig) return null;
    if (!(await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(body)))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    return typeof payload.exp === 'number' && payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

export function readCookie(request, name) {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

export const setCookie = (name, value, maxAge) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export async function sessionFrom(request, env) {
  const p = await verify(readCookie(request, 'scamdb_session'), env.SESSION_SECRET);
  return p ? { githubId: p.githubId, login: p.login } : null;
}
