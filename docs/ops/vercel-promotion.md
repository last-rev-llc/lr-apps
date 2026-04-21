# Vercel environment promotion

This is the zero-downtime workflow for promoting an env-var change from
staging to production. The same flow applies whether you are rotating a
secret, adding a new var, or pointing an existing var at a different value.

## Vercel scope reminder

Vercel exposes three env scopes per project: **Development**, **Preview**,
**Production**. We use them as follows:

| Vercel scope | Used by                                       | Maps to our `DEPLOYMENT_ENV` |
|--------------|-----------------------------------------------|------------------------------|
| Development  | `vercel dev` only — rarely used               | `local`                      |
| Preview      | every PR preview + the long-lived `staging.*` deployment | `staging`                    |
| Production   | `apps.lastrev.com`                            | `production`                 |

## Promotion flow

1. **Stage the change in the Preview scope.** From the Vercel dashboard
   (Settings → Environment Variables) add or update the var with scope
   `Preview` only. Trigger a redeploy of an open PR (or push a no-op commit
   on the staging branch). Verify the change works on the preview URL.
2. **Validate.** Run the relevant smoke test against the preview:
   - Auth0 secret change → log in and confirm `appSession` cookie is set.
   - Stripe key change → trigger a test-mode checkout and confirm webhook
     fires.
   - Supabase key change → load any page that runs an RLS query.
3. **Copy to Production scope.** In the same dashboard view, add the var
   again with scope `Production`. Do **not** delete the Preview value yet —
   Preview and Production read independent values, so this is purely
   additive.
4. **Trigger a Production redeploy.** Either merge the staging branch to
   `main` (preferred — keeps git history aligned with deploys) or use the
   "Redeploy" button on the latest Production deployment.
5. **Verify Production.** Re-run the smoke test against `apps.lastrev.com`.
6. **Roll back if needed.** If verification fails, revert the Production
   var to its prior value and redeploy. Preview keeps the new value so you
   can iterate without churning Production.

## Vars that must NOT be promoted unchanged

Some vars logically differ between staging and production and must be set
to a different value in Production rather than copied verbatim. Promoting
these unchanged will break auth or billing.

- `DEPLOYMENT_ENV` — must be `production`, not `staging`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID` — point at the
  production Supabase project.
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`,
  `AUTH0_PRODUCTS_JSON` — production Auth0 tenant + production client
  IDs/secrets. Sharing `AUTH0_SECRET` across environments would let staging
  cookies decrypt against production.
- `AUTH0_ALLOWED_BASE_URLS`, `APP_BASE_URL`, `NEXT_PUBLIC_AUTH_URL` — the
  production hostnames, never preview wildcards.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_*` — switch from
  `sk_test_…` / `pk_test_…` to `sk_live_…` / `pk_live_…` and the live-mode
  webhook secret + live-mode price IDs.
- `CRON_SECRET` — should be a different random value in production so a
  leaked staging value cannot trigger production cron jobs.

## Vars that ARE safe to promote unchanged

- Feature-flag env vars (when added) — usually shared so that what you
  tested on staging is what runs in prod.
- `APP_SELF_ENROLL_SLUGS` — usually intentionally identical between
  environments. Tighten only if staging needs a broader allowlist than
  prod.

## Reference

- Env-var matrix: [environments.md](./environments.md)
- Secret rotation runbook: [secrets-rotation.md](./secrets-rotation.md)
- Preview deployment specifics: [preview-deployments.md](./preview-deployments.md)
