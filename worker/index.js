// scamdb Worker: runs only on the dynamic paths in wrangler.jsonc (assets.run_worker_first).
// Everything else is a static asset and never reaches this code.
import { HttpError, error, cors } from './http.js';
import { handleReport } from './reports.js';
import { cleanup } from './cleanup.js';
import { authStart, authCallback, logout } from './github.js';
import { handleKeys } from './keys.js';
import { handleIsItAScam } from './isitascam.js';
import { feedTrends, feedBrands, publicTrends } from './feed.js';
import { authKey } from './keys.js';
import { handleCollect, handleCollectRun, handleCollectSettings, handleReview, handleReviewRuns, handleReviewSources } from './review.js';

// Secrets each group of routes needs. Missing or too-short secrets close the route (503) instead of running insecurely.
const NEEDS = {
  reports: [['IP_SALT', 16], ['TURNSTILE_SECRET', 1]],
  isitascam: [['IP_SALT', 16]],
  account: [['SESSION_SECRET', 32], ['GITHUB_CLIENT_ID', 1], ['GITHUB_CLIENT_SECRET', 1]],
  collect: [['COLLECTOR_TOKEN', 32]],
  review: [['SESSION_SECRET', 32]],
};
const configured = (env, group) => (NEEDS[group] ?? []).every(([name, min]) => typeof env[name] === 'string' && env[name].length >= min);

const ROUTES = [
  ['OPTIONS', /^\/v1\/reports$/, () => cors(new Response(null, { status: 204 }))],
  ['POST', /^\/v1\/reports$/, handleReport, 'reports'],
  ['OPTIONS', /^\/v1\/isitascam$/, () => cors(new Response(null, { status: 204 }))],
  ['POST', /^\/v1\/isitascam$/, handleIsItAScam, 'isitascam'],
  ['GET', /^\/v1\/trends$/, publicTrends],
  ['GET', /^\/v1\/feed\/trends$/, (r, env) => feedTrends(r, env, authKey)],
  ['GET', /^\/v1\/feed\/brands$/, (r, env) => feedBrands(r, env, authKey)],
  ['GET', /^\/v1\/keys\/me$/, handleKeys, 'account'],
  ['GET', /^\/v1\/keys\/me\/reveal$/, handleKeys, 'account'],
  ['POST', /^\/v1\/keys$/, handleKeys, 'account'],
  ['DELETE', /^\/v1\/keys\/me$/, handleKeys, 'account'],
  // Source review queue (docs/sources.md): the home-lab collector writes, the owner reviews. Not part of the public API.
  ['POST', /^\/v1\/collect$/, handleCollect, 'collect'],
  ['POST', /^\/v1\/collect\/run$/, handleCollectRun, 'collect'],
  ['GET', /^\/v1\/review\/runs$/, handleReviewRuns, 'review'],
  ['GET', /^\/v1\/review\/sources$/, handleReviewSources, 'review'],
  ['POST', /^\/v1\/review\/sources\/[a-z0-9-]+$/, handleReviewSources, 'review'],
  ['GET', /^\/v1\/collect\/settings$/, handleCollectSettings, 'collect'],
  ['GET', /^\/v1\/review\/items$/, handleReview, 'review'],
  ['POST', /^\/v1\/review\/items\/\d+$/, handleReview, 'review'],
  ['GET', /^\/auth\/github$/, authStart, 'account'],
  ['GET', /^\/auth\/github\/callback$/, authCallback, 'account'],
  ['POST', /^\/auth\/logout$/, logout, 'account'],
];

/** Routes a request; anything unknown goes to the static assets. Exported for tests. */
export async function handle(request, env, ctx) {
  const { pathname } = new URL(request.url);
  const route = ROUTES.find(([method, re]) => method === request.method && re.test(pathname));
  const isReports = pathname === '/v1/reports' || pathname === '/v1/isitascam'; // open CORS, errors included
  const url = new URL(request.url);
  try {
    if (!route) return env.ASSETS.fetch(request);
    // Sign-in cookies live on scamdb.dev only, so sign-in and keys always happen there (www would lose the state cookie).
    if (url.hostname === 'www.scamdb.dev' && pathname.startsWith('/auth/')) return Response.redirect(`https://scamdb.dev${pathname}${url.search}`, 301);
    if (route[3] && !configured(env, route[3])) {
      if (pathname.startsWith('/auth/github')) return new Response(null, { status: 302, headers: { location: '/account/?error=setup' } });
      throw new HttpError(503, 'not_configured', 'This part of scamdb is not switched on yet.');
    }
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
