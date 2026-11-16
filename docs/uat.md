# UAT (test site)

Every branch that isn't `main` gets its own **Preview**: a full copy of scamdb (site, API, sign-in) at
`https://<branch>-scamdb.<your-account>.workers.dev`. Workers Builds posts the link on each pull request.

What a Preview uses (set in the `previews` block of `wrangler.jsonc`):

- **Database:** `scamdb-uat`, a separate D1 database. Reports and keys made on a Preview never reach production.
- **Workers AI:** the same binding as production, sharing the free daily allowance.
- **`ENVIRONMENT=uat`:** sign-in returns to the Preview's own URL instead of scamdb.dev.
- **Not indexed:** every `*.workers.dev` page is sent with `X-Robots-Tag: noindex`.
- **No cron:** the daily cleanup runs on production only.

## One-time setup (owner)

Previews don't get production's secrets. Set them once for all new Previews, using **different** values from
production. Paste the output of `openssl rand -base64 32` for each random one:

```bash
npx wrangler preview base-config secret put IP_SALT
```

```bash
npx wrangler preview base-config secret put SESSION_SECRET
```

Reports from a form need Turnstile. On UAT, use Cloudflare's always-pass test secret,
`1x0000000000000000000000000000000AA`. Keyed reports don't need it.

```bash
npx wrangler preview base-config secret put TURNSTILE_SECRET
```

**Sign-in on UAT:** GitHub allows one callback URL per OAuth app, so make a second app called "scamdb UAT". Use a
stable Preview named `uat`:

1. Deploy it once:

   ```bash
   npx wrangler preview --name uat
   ```

2. Create the OAuth app with the callback `https://uat-scamdb.<your-account>.workers.dev/auth/github/callback`.
3. Save its ID and secret for Previews:

   ```bash
   npx wrangler preview base-config secret put GITHUB_CLIENT_ID
   ```

   ```bash
   npx wrangler preview base-config secret put GITHUB_CLIENT_SECRET
   ```

Base secrets only reach Previews created after they're set. An existing Preview gets them with
`npx wrangler preview secret put NAME --name <preview>`. On other branch Previews, everything works except
sign-in, because their URLs aren't registered with GitHub.

## Database changes

A new file in `migrations/` must be applied to both databases:

```bash
npx wrangler d1 migrations apply scamdb-uat --remote
```

```bash
npx wrangler d1 migrations apply scamdb --remote
```
