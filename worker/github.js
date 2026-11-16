// Sign in with GitHub (OAuth web flow). Reads only the public profile; the GitHub token is used once and dropped.
import { error } from './http.js';
import { sign, readCookie, setCookie } from './session.js';

const CALLBACK = 'https://scamdb.dev/auth/github/callback';
const SESSION_DAYS = 30;
const redirect = (location, cookies = []) => {
  const h = new Headers({ location });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(null, { status: 302, headers: h });
};

export function authStart(request, env) {
  const state = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', CALLBACK);
  url.searchParams.set('scope', '');
  url.searchParams.set('state', state);
  return redirect(url.toString(), [setCookie('scamdb_state', state, 600)]);
}

export async function authCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const expected = readCookie(request, 'scamdb_state');
  if (!state || !expected || state !== expected) return error(400, 'bad_state', 'Sign-in expired or was tampered with. Try again from the account page.');
  try {
    const tok = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code'), redirect_uri: CALLBACK }),
    });
    const { access_token } = await tok.json();
    if (!access_token) throw new Error('no token');
    const u = await fetch('https://api.github.com/user', { headers: { authorization: `Bearer ${access_token}`, 'user-agent': 'scamdb', accept: 'application/vnd.github+json' } });
    if (!u.ok) throw new Error('no user');
    const { id, login } = await u.json();
    if (!Number.isInteger(id) || typeof login !== 'string') throw new Error('bad user');
    const session = await sign({ githubId: id, login, exp: Date.now() + SESSION_DAYS * 86400000 }, env.SESSION_SECRET);
    return redirect('/account/', [setCookie('scamdb_session', session, SESSION_DAYS * 86400), setCookie('scamdb_state', '', 0)]);
  } catch {
    return redirect('/account/?error=github', [setCookie('scamdb_state', '', 0)]);
  }
}

export const logout = () => redirect('/account/', [setCookie('scamdb_session', '', 0)]);
