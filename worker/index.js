// scamdb Worker: runs only on the dynamic paths in wrangler.jsonc (assets.run_worker_first).
// Everything else is a static asset and never reaches this code.
import { HttpError, error, cors } from './http.js';
import { handleReport } from './reports.js';
import { cleanup } from './cleanup.js';
import { authStart, authCallback, logout } from './github.js';
import { handleKeys } from './keys.js';

// Secrets each group of routes needs. Missing or too-short secrets close the route (503) instead of running insecurely.
const NEEDS = {
  reports: [['IP_SALT', 16], ['TURNSTILE_SECRET', 1]],
  account: [['SESSION_SECRET', 32], ['GITHUB_CLIENT_ID', 1], ['GITHUB_CLIENT_SECRET', 1]],
};
const configured = (env, group) => (NEEDS[group] ?? []).every(([name, min]) => typeof env[name] === 'string' && env[name].length >= min);

const ROUTES = [
  ['OPTIONS', /^\/v1\/reports$/, () => cors(new Response(null, { status: 204 }))],
  ['POST', /^\/v1\/reports$/, handleReport, 'reports'],
  ['GET', /^\/v1\/keys\/me$/, handleKeys, 'account'],
  ['POST', /^\/v1\/keys$/, handleKeys, 'account'],
  ['DELETE', /^\/v1\/keys\/me$/, handleKeys, 'account'],
  ['GET', /^\/auth\/github$/, authStart, 'account'],
  ['GET', /^\/auth\/github\/callback$/, authCallback, 'account'],
  ['POST', /^\/auth\/logout$/, logout, 'account'],
];

/** Routes a request; anything unknown goes to the static assets. Exported for tests. */
export async function handle(request, env, ctx) {
  const { pathname } = new URL(request.url);
  const route = ROUTES.find(([method, re]) => method === request.method && re.test(pathname));
  const isReports = pathname === '/v1/reports';
  try {
    if (!route) return env.ASSETS.fetch(request);
    if (route[3] && !configured(env, route[3])) throw new HttpError(503, 'not_configured', 'This part of scamdb is not switched on yet.');
    return await route[2](request, env, ctx);
  } catch (e) {
    const r = e instanceof HttpError ? error(e.status, e.code, e.message, e.headers) : error(500, 'internal', 'Something went wrong on our side.');
    return isReports ? cors(r) : r;
  }
}

export default {
  fetch: (request, env, ctx) => handle(request, env, ctx),
  scheduled: (event, env, ctx) => ctx.waitUntil(cleanup(env.DB, new Date(event.scheduledTime))),
};
