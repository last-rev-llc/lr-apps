# Disaster recovery

This is the recovery baseline for the platform. Read it before
production traffic scales — or before you need it. Every section
documents what we promise to recover (RTO/RPO), the procedure to
recover, and who to call.

## RTO / RPO targets

| Service       | Tier             | RTO (recovery time)  | RPO (data loss)         | Notes                                                                                                       |
|---------------|------------------|----------------------|-------------------------|-------------------------------------------------------------------------------------------------------------|
| Supabase (DB) | Pro plan         | ~30 min (PITR)       | ≤ 2 min (WAL streaming) | PITR retention is **7 days** on Pro. Verify in dashboard. Restore creates a new project — env vars must be repointed. |
| Stripe        | (vendor managed) | n/a                  | 0                       | Stripe persists every event server-side. Our handler is idempotent against `processed_webhook_events`.       |
| Auth0         | (vendor managed) | hours                | minutes                 | Tenant restore is via export/import (no managed PITR). Treat user list as the most critical artifact.         |
| Vercel        | (vendor managed) | minutes              | 0 (stateless)           | We do not store data on Vercel; redeploys are deterministic from `main`.                                     |

These are **assumptions**. After every incident, update the relevant
row with the actual measured time and link to the postmortem.

## Supabase point-in-time recovery (PITR)

Available on the Pro plan. Restores the entire project to any second
within the retention window. **Restoring creates a new project** with a
new `<ref>.supabase.co` URL and new API keys — you cannot restore in
place.

### Dashboard procedure

1. Supabase dashboard → select the affected project → Database →
   Backups → **Point in time**.
2. Pick the timestamp just before the incident. Click **Restore**.
3. Supabase provisions a new project. Wait for status `Healthy`.
4. From the new project's Settings → API, copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROJECT_ID`
5. Update those four vars in **Vercel Production scope** and redeploy.
6. Run the smoke test: load any page that does an RLS query, log in,
   place a Stripe test transaction, confirm the webhook persists.
7. Decommission the corrupted project once you are confident the
   restore is healthy (≥ 24h observation).

### CLI procedure (faster for ops engineers)

```sh
# 1. Dump from the restored project (created via dashboard above):
supabase db dump --db-url "$RESTORED_DB_URL" -f restore.sql

# 2. (Optional) inspect / verify before swapping production traffic:
psql "$RESTORED_DB_URL" -c '\dt public.*'

# 3. Update Vercel env vars (see step 5 above) and redeploy.
```

### Daily backup schedule

Supabase Pro takes a **daily** backup with **7 days** of retention; PITR
runs continuously over the same window. Verify the current schedule and
retention in the dashboard (Database → Backups) — vendor defaults change
without notice.

## Stripe webhook event replay

Used to recover events that Stripe attempted to deliver while our
endpoint was down (or while a deploy was in flight, or while a wrong
webhook secret was active). Our `processed_webhook_events` table is
idempotent — replaying an already-processed event is a no-op.

### Identify missed events

1. Stripe dashboard → Developers → Events.
2. Filter by date window covering the outage.
3. Sort by status — events that returned non-2xx will be flagged as
   failed deliveries with retry attempts.

### Replay via dashboard

For a small number of events: click the event → **Resend webhook** in
the dashboard.

### Replay via CLI

For a bulk replay:

```sh
# List failed events in the window
stripe events list \
  --created.gte=$(date -u -d '2 hours ago' +%s) \
  --type 'checkout.session.completed' \
  --limit 100

# Resend each one
stripe events resend evt_1ABCxyz...
```

Idempotency: our handler checks `processed_webhook_events.event_id`
before doing any work. Replaying is safe even if some events succeeded
the first time.

## Auth0 tenant export / import

Auth0 has no managed PITR. The recovery primitive is the **tenant
export** — a JSON snapshot of tenant settings, connections, rules,
actions, and application configurations. **Users are NOT included**
and must be exported separately.

### Routine export (run weekly via cron or manually)

```sh
# Tenant settings + applications + connections + rules
auth0 tenant export --format json > auth0-tenant-$(date +%Y%m%d).json

# Users (separate User Import / Export extension)
auth0 users export --format json > auth0-users-$(date +%Y%m%d).json
```

Store exports in an encrypted bucket (NOT in this repo).

### Restore order

1. Provision a new Auth0 tenant (or use a pre-staged DR tenant).
2. Import tenant settings: `auth0 tenant import auth0-tenant-<date>.json`.
3. Import users: `auth0 users import auth0-users-<date>.json`.
4. Update `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
   (and per-product entries in `AUTH0_PRODUCTS_JSON`) in Vercel
   Production scope. Redeploy.
5. Verify a fresh login.

User session continuity is impossible — every user must re-authenticate.

## Failure scenario playbooks

### Scenario 1 — Database corruption / accidental drop

**Symptom**: queries return wrong data, or a table is missing.

1. **Stop writes.** Put up a maintenance banner; flip a kill switch on
   any cron job that might amplify the corruption.
2. **PITR to a timestamp 1–2 minutes before the incident** (see
   procedure above).
3. Repoint Vercel env vars to the restored project; redeploy.
4. Audit deltas: anything written between the chosen restore point and
   "now" is gone unless captured externally (Stripe events can be
   replayed; Auth0 user signups since the restore point need to be
   manually re-created from Auth0 logs).
5. Postmortem; update RTO/RPO row above with measured times.

### Scenario 2 — Auth provider (Auth0) outage

**Symptom**: `/auth/login` returns 5xx; users cannot start a new
session. Existing valid `appSession` cookies still work.

We **fail closed** — there is no kill switch that bypasses Auth0. New
logins are blocked until Auth0 recovers.

1. Confirm via Auth0 status page that this is a vendor incident.
2. Post a status banner: "Sign-in temporarily unavailable; existing
   sessions remain active."
3. Do NOT attempt to spin up a replacement tenant during a brief
   outage — the data-migration cost (export / import / cookie
   invalidation) is much higher than the downtime.
4. For an outage > 4 hours, escalate to Auth0 support and consider
   activating a pre-staged DR tenant per the export/import procedure
   above.
5. After recovery, verify Auth0 callback URL allowlists were not
   reset.

### Scenario 3 — Billing provider (Stripe) outage

**Symptom**: checkout sessions fail; webhook deliveries pause.

Stripe webhooks queue automatically and retry for up to 3 days. Our
handler is idempotent. So:

1. Confirm via Stripe status page.
2. For an outage < 1h: no action required. Stripe retries on its own.
3. For an outage > 1h: post a status banner; pause any in-app
   "subscribe" CTAs to avoid user-visible 5xx during checkout.
4. After recovery, run the **Stripe webhook event replay** procedure
   above to confirm no events were lost.

## Incident contact list

| Vendor          | Channel                                  | SLA / response                                     |
|-----------------|------------------------------------------|----------------------------------------------------|
| Supabase (Pro)  | Dashboard → Support → Submit ticket; `support@supabase.com` | Pro tier: best-effort within 1 business day; Enterprise SLA differs. |
| Stripe          | `https://support.stripe.com/contact` (chat available); status: `https://status.stripe.com` | Best-effort; emergency lane for live-mode outages. |
| Auth0           | Dashboard → Support → Submit ticket; status: `https://status.auth0.com` | Free / Developer plans: community only. Paid plans: 24h response. |
| Vercel          | Dashboard → Help; status: `https://www.vercel-status.com` | Pro: in-dashboard chat. Enterprise: pager.         |

Verify each vendor's current SLA in their dashboard before relying on
the row above — vendor SLAs change.

## See also

- [`secrets-rotation.md`](./secrets-rotation.md) — rotate secrets
  ahead of (and after) any DR exercise.
- [`environments.md`](./environments.md) — env-var matrix to repoint
  during a restore.
- [`vercel-promotion.md`](./vercel-promotion.md) — promotion flow used
  to deploy the restored configuration.
- [`../guides/migrations.md`](../guides/migrations.md) — manual
  production revert procedure for a single migration.
