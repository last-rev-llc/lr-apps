# Secrets rotation runbook

The platform depends on six long-lived secrets. Each one is independently
rotatable and each section below covers:

1. **Generate** — how to mint the new value.
2. **Stage** — set it in Vercel's `Preview` scope, validate on the
   staging deployment, then promote to `Production`.
3. **Verify** — confirm the old secret no longer works.
4. **Roll back** — what to do if the new secret causes a live incident.

## Mandatory rotation order

When rotating multiple secrets in the same maintenance window, do them in
this order:

1. **Stripe** (webhook secret + secret key)
2. **Supabase** (service role key)
3. **Auth0** (client secret per product, then `AUTH0_SECRET`)
4. **`CRON_SECRET`**

Why this order:

- A Stripe webhook-secret mismatch only breaks **inbound** webhooks. Our
  handler is idempotent (`processed_webhook_events` table), so Stripe
  will retry once the new secret is in place. This is the smallest blast
  radius.
- A Supabase service-role rotation breaks server-side queries until the
  new key is deployed everywhere. Doing this second means Auth0 (the
  next step) is still working when you validate.
- Auth0 client-secret rotation invalidates active access tokens / forces
  re-login for any session whose cookie was signed with the old
  `AUTH0_SECRET`. Do this third so users in flight aren't bounced
  multiple times in the same window.
- `CRON_SECRET` rotation only breaks scheduled jobs (Vercel cron). Last
  because the blast radius is smallest and easiest to detect.

After every rotation, **log it** in
[`ROTATION_HISTORY.md`](./ROTATION_HISTORY.md).

---

## Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`)

### Generate

1. Stripe dashboard → Developers → Webhooks.
2. Select the production endpoint. Click **Roll secret**. Stripe shows
   the new `whsec_…` value once.
3. Stripe keeps the **old** secret valid for 24 hours by default — that
   is the safe overlap window for in-flight webhook deliveries.

### Stage → Production (zero-downtime)

1. Vercel → Settings → Environment Variables → set
   `STRIPE_WEBHOOK_SECRET` (Preview scope) to the new value. Redeploy a
   PR preview.
2. From Stripe dashboard → Webhooks → recent deliveries, click **Resend**
   on a recent event. Confirm the preview deployment returns 200.
3. Update the same var in the Production scope. Redeploy production.
4. Verify a fresh production webhook is signed by the new secret (any
   live customer event, or the dashboard's "Send test event" button).

### Verify the old secret is revoked

After the 24-hour overlap, attempt to replay an old event with the
**old** signature. Stripe will reject it with a signature mismatch.
Alternatively, in the Stripe dashboard → Webhook secret history, the old
secret is shown as expired.

### Rollback

If production webhook handling breaks:

1. Click **Roll back** in the Stripe webhook secret history (returns to
   the previous secret if still within the overlap window).
2. Otherwise, set `STRIPE_WEBHOOK_SECRET` back to the prior value in
   Vercel (Production scope) and redeploy. Stripe will retry failed
   webhooks for up to 3 days.
3. File an incident with the failure timestamp range; replay missed
   events per [`disaster-recovery.md`](./disaster-recovery.md).

---

## Stripe secret key (`STRIPE_SECRET_KEY`)

### Generate

1. Stripe dashboard → Developers → API keys.
2. Click **Create restricted key** (preferred) or **Roll** the live
   secret key. Stripe shows the new `sk_live_…` value once.
3. The old key remains valid until you click **Reveal expired key →
   Revoke**. That gives you a controllable overlap window — do NOT
   revoke the old key until the new one is verified everywhere.

### Stage → Production

1. Set `STRIPE_SECRET_KEY` in Vercel Preview scope. Redeploy a PR
   preview that exercises a checkout flow.
2. Confirm a test-mode checkout creates a session (preview always uses
   test mode, so this validates plumbing not the live key).
3. Set the same var in Production scope. Redeploy production.
4. Trigger a real `stripe.checkout.sessions.create` (a real customer
   purchase, or use a low-value internal test product).

### Verify

In the Stripe dashboard → Developers → API keys → click on the old key
→ **Last used**. After ≥ 1h with no traffic, **Revoke** the old key. A
subsequent request with the old key returns HTTP 401 from Stripe.

### Rollback

If a checkout flow breaks: set `STRIPE_SECRET_KEY` back to the prior
value (still valid because you have not revoked it yet) and redeploy.

---

## Auth0 client secret (`AUTH0_CLIENT_SECRET`, per product in `AUTH0_PRODUCTS_JSON`)

### Generate

1. Auth0 dashboard → Applications → select the application → Settings.
2. Scroll to **Client Secret** → **Rotate** (Auth0 generates a new
   value). Auth0 supports **two active secrets** during a rotation
   window — the old secret remains valid until you explicitly revoke
   it. This is the safe overlap.
3. Repeat for every product that has its own application in
   `AUTH0_PRODUCTS_JSON`.

### Stage → Production

1. In Vercel Preview scope, update `AUTH0_CLIENT_SECRET` (or the
   per-product entry inside `AUTH0_PRODUCTS_JSON`). Redeploy a preview.
2. Log in on the preview against the staging tenant and confirm the
   `appSession` cookie is set.
3. Promote to Production scope. Redeploy.
4. Verify a fresh login on `apps.lastrev.com` succeeds.

### Verify the old secret is revoked

```sh
curl -s -X POST "https://$AUTH0_DOMAIN/oauth/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=$AUTH0_CLIENT_ID" \
  -d "client_secret=<OLD_SECRET>" \
  -d "audience=https://$AUTH0_DOMAIN/api/v2/"
```

Should return `{"error":"access_denied", ...}` after Auth0's rotation
window expires (or after you click **Revoke** in the dashboard).

### Rollback

Auth0 keeps the prior secret as a "previous secret" for the rotation
window. Click **Use previous secret** in the dashboard, then revert the
Vercel var to the old value and redeploy.

---

## `AUTH0_SECRET`

This is the cookie-signing key used by `@auth0/nextjs-auth0`. Rotating
it invalidates **every** active session — users will be silently logged
out and asked to re-authenticate.

### Generate

```sh
openssl rand -hex 32
```

### Safe overlap

`@auth0/nextjs-auth0` does not natively support a two-key overlap.
Mitigate by:

- Rotating outside peak hours.
- Posting an in-app banner ahead of time.
- Setting the session cookie `maxAge` to ≤ 15 minutes a day before, so
  the population of "in-flight long sessions" shrinks by the rotation
  window.

### Stage → Production

1. Set `AUTH0_SECRET` in Vercel Preview scope. Redeploy. Log in fresh
   on the preview to confirm the new secret signs cookies correctly.
2. Promote to Production. Redeploy. **All active sessions are
   invalidated** at this moment — users see the login screen on the
   next request.
3. Confirm in Auth0 logs that subsequent logins succeed.

### Verify the old secret no longer works

A request with a session cookie signed by the old secret fails the
HMAC check; the user is redirected to `/auth/login`.

### Rollback

Revert the Vercel var to the old value and redeploy. Sessions issued
during the new-secret window will then themselves be invalidated.
Realistically, this is a one-way door — pick the new secret carefully.

---

## Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`)

### Generate

1. Supabase dashboard → Project Settings → API.
2. Click **Reset service role key**. Supabase shows the new key once.
3. Supabase **immediately revokes** the old service-role key on reset.
   There is no overlap window — plan accordingly.

### Stage → Production (special: no overlap)

Because Supabase has no overlap, do this rotation as a single sequence:

1. Reset on the **staging** Supabase project first; update the staging
   Vercel `Preview` scope; redeploy a preview; verify reads/writes
   work.
2. Reset on the **production** Supabase project. Immediately update
   `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production scope and trigger
   a redeploy.
3. There will be a small (seconds-to-minutes) window where the old key
   is rejected and the new deployment is still being built. Service-
   role traffic during this window will fail with `Invalid API key`.
   Schedule during low traffic.

### Verify

```sh
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/app_permissions?select=id&limit=1" \
  -H "apikey: <OLD_KEY>" \
  -H "Authorization: Bearer <OLD_KEY>"
```

Should return `{"message":"Invalid API key"}` (HTTP 401).

### Rollback

Supabase has no rollback for a reset key — once reset, the old value is
permanently invalid. The recovery path is a fix-forward: confirm the
new key is propagated, redeploy, and replay any failed cron jobs.

---

## `CRON_SECRET`

Shared secret used to authenticate Vercel Cron requests against our
`/api/cron/*` endpoints.

### Generate

```sh
openssl rand -hex 32
```

### Stage → Production

1. Update `CRON_SECRET` in Vercel Preview scope. Redeploy.
2. Manually invoke a cron endpoint with the new secret to verify:
   ```sh
   curl -s "https://<preview-url>/api/cron/<job>" \
     -H "Authorization: Bearer <NEW_SECRET>"
   ```
3. Update Vercel Production scope. Redeploy.
4. Confirm the next scheduled cron run logs success.

### Safe overlap

Cron endpoints are server-side only and called by Vercel itself —
there are no in-flight client requests. The overlap window is the time
between updating the var and the next scheduled run; pick a quiet
moment.

### Verify the old secret is revoked

```sh
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://apps.lastrev.com/api/cron/<job>" \
  -H "Authorization: Bearer <OLD_SECRET>"
```

Expected: `401`.

### Rollback

Revert the Vercel var. Use a different secret next time and document
why the rotation failed in `ROTATION_HISTORY.md`.

---

## See also

- [`environments.md`](./environments.md) — env-var matrix.
- [`vercel-promotion.md`](./vercel-promotion.md) — promotion workflow
  used by every "Stage → Production" section above.
- [`disaster-recovery.md`](./disaster-recovery.md) — Stripe replay,
  Supabase PITR, Auth0 export.
- [`ROTATION_HISTORY.md`](./ROTATION_HISTORY.md) — append a row after
  every rotation.
