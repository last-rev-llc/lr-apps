# Zero-downtime deploy checklist

This is the pre-deploy playbook for shipping changes to production
without dropping requests, webhook deliveries, or in-flight server
actions. It covers Vercel's rolling-deploy semantics, the
expand-then-contract pattern for additive database changes, feature
flags for dark launches, and Vercel traffic splitting for canary
rollouts.

## Pre-deploy checklist

Run this list before merging to `main` (Production) or promoting a
staging deploy:

- [ ] **Env vars registered.** Any new env var is present in
      `turbo.json` `globalEnv` and in the correct Vercel scope. See
      [vercel-promotion.md](./vercel-promotion.md) for the promotion
      flow.
- [ ] **Migration pairs present.** Every new `supabase/migrations/<name>.sql`
      ships with a matching `<name>.down.sql`. Enforced by
      `pnpm db:check-migration-pairs` and the CI "Migration pair lint"
      step. See [migrations.md](../guides/migrations.md).
- [ ] **Migrations are additive.** The up migration is expand-only for
      the deploy being shipped — no `DROP COLUMN`, `DROP TABLE`, or
      type-narrowing `ALTER` that would break the currently-running
      version. Destructive changes come in a later deploy; see
      [Expand-contract migration steps](#expand-contract-migration-steps).
- [ ] **Smoke targets identified.** You know which flows you will
      exercise on the new deployment before widening traffic: login,
      a Stripe test-mode checkout (if billing code touched), at least
      one RLS-guarded Supabase read.
- [ ] **On-call paged / aware.** Someone who can roll back is
      reachable for the cutover window.
- [ ] **Rollback plan known.** Either re-alias the previous Vercel
      deployment (see [Vercel traffic splitting](#vercel-traffic-splitting-for-canary-deploys))
      or, for a schema issue, apply the paired `.down.sql` via the
      manual revert procedure in
      [migrations.md](../guides/migrations.md#manual-revert-in-production).
- [ ] **Feature flags default off.** Any behavior behind a
      `feature_flags` row (once #18 lands) is off by default and can be
      enabled incrementally after the deploy is healthy. See
      [Feature-flag rollout pattern](#feature-flag-rollout-pattern).

## Vercel rolling deploy behavior

Vercel does **not** cut traffic instantaneously between deployments.
Promoting a new Production deployment temporarily leaves two
deployments live:

- The previously-promoted deployment continues to serve any request
  that was already in flight, any request that resolves to its asset
  URLs (built JS/CSS with hashed filenames), and any server action
  bound to pages it rendered.
- The new deployment takes over the Production alias and serves all
  new navigations and API calls.

Practical consequences for this codebase:

- **Both versions serve concurrently during cutover.** Every API
  route, webhook handler, and proxy branch needs to accept the same
  inputs as the version before it during the overlap window. Do not
  remove an endpoint in the same deploy that stops calling it — delete
  the caller first, ship, then delete the endpoint in a later deploy.
- **Server actions are bound to the deployment that rendered the
  page.** A user who loaded a page from the old deployment will
  continue to invoke the old deployment's server action handler even
  after promotion. If that deployment is later fully retired (Vercel
  garbage-collects old deployments), the action 404s. Server actions
  added/removed in a deploy are safe in flight but unsafe across a
  hard-refresh boundary — plan for the client to reload if you rename
  or remove an action.
- **Proxy and `app-registry.ts`.** Because `proxy.ts` consults
  `apps/web/lib/app-registry.ts` at request time, a subdomain added in
  the new deploy starts resolving as soon as its alias is live — but
  the old deployment (still handling in-flight traffic) does not know
  about it. Net effect: the new subdomain will 404 from the old
  deployment for up to a few seconds. Removing a slug is riskier —
  the old deployment keeps serving it until retired.
- **Supabase connections survive across deploys.** Supabase pooled
  connections (`@repo/db` clients) are per-request for server
  components and per-process for service-role calls. Rolling a new
  deploy does not evict the pool; the new deployment opens its own
  pool on first request. No coordination needed — but see
  [Expand-contract](#expand-contract-migration-steps) before changing
  schema.
- **Auth0 session cookies survive.** `appSession` is signed with
  `AUTH0_SECRET` and decrypts from either deployment, so users do not
  get bounced back through login during a rolling deploy. (This is
  also why `AUTH0_SECRET` is environment-scoped — see
  [vercel-promotion.md](./vercel-promotion.md#vars-that-must-not-be-promoted-unchanged).)

## Webhook availability during rolling deploys

Stripe (and any future webhook provider) will keep retrying a failed
POST for up to three days, so a momentary 5xx during cutover is
recoverable — but we can do better than that:

- **Health check endpoint (depends on #149).** Once `/api/health`
  lands, Vercel can use it as a readiness gate so a new deployment
  receives traffic only after it reports healthy. This section
  becomes load-bearing when that endpoint is live; until then the
  rolling deploy is "best effort healthy on first byte."
- **Idempotency via `processed_webhook_events`.** The table created by
  `supabase/migrations/003_webhook_events.sql` makes webhook replay
  safe — the handler checks `event_id` before doing any work, so a
  request served twice (once by the old deployment before shutdown,
  once by the new deployment on retry) produces one effect. This is
  what lets us ship webhook handler changes safely: a missed delivery
  can always be replayed via the Stripe dashboard or the CLI, per
  [disaster-recovery.md](./disaster-recovery.md#stripe-webhook-event-replay).
- **Stripe signature verification is version-stable.** Both
  deployments verify against the same `STRIPE_WEBHOOK_SECRET`. The
  secret is scoped per environment in Vercel — do NOT rotate the
  webhook secret in the same deploy that changes the handler logic,
  or the window where both deployments are alive will split between
  two signing keys and half the replays will fail verification.
- **Never remove a webhook route in the deploy that stops sending to
  it.** The sequence is: (1) ship a deploy that stops pointing Stripe
  at the route, (2) wait through Stripe's retry window (≥ 3 days),
  (3) ship a later deploy that removes the handler. The same rule
  applies in reverse for adding a new webhook: ship the handler
  first, wait for the deploy to promote, then register the endpoint
  in Stripe.

## Expand-contract migration steps

Schema changes that could break the currently-running version must be
split across **at least two deploys**. `supabase/migrations/` is
append-only (see [CLAUDE.md](../../CLAUDE.md#db)), so every step below
is a new numbered migration file with a paired `.down.sql`.

### Step 1 — Expand (additive-only)

Deploy a migration that only adds to the schema:

- Add the new column as `NULL`-able (or with a server-side default
  expression). Never add a `NOT NULL` column without a default in an
  expand step — it blocks writes from the old deployment.
- Create new tables / indexes. Indexes can be `CREATE INDEX
  CONCURRENTLY` if they might be slow; Supabase allows it on Pro.
- Add the paired `.down.sql` that drops exactly what you added. Use
  `IF EXISTS` guards (same rule as every other down file).

Deploy the app code in this step so it **reads from both shapes** —
old and new — but continues to **write to the old shape**. Both the
old and new app deployments are compatible with the new schema.

### Step 2 — Backfill

Once the expand migration is live in Production:

- Populate the new column / table from the existing data (a one-shot
  script via `pnpm db:exec` or the Supabase SQL editor, not a
  migration). Chunk updates to avoid long-running transactions.
- Flip the app code to **write to the new shape** while still reading
  from both. Ship this as a separate deploy. Keep it live long
  enough to confirm no code path still writes to the old shape.

### Step 3 — Contract

Only after the old shape is fully drained — both by running code and
by any background jobs — ship a final migration that removes it:

- `DROP COLUMN` / `DROP TABLE` / narrow `ALTER` types in a new
  numbered migration file with a paired `.down.sql` that re-creates
  the old shape (the down file is the insurance policy if you need
  to roll back the contract).
- Delete the dead read paths from the app code in the same deploy.

### Rollback

Use `pnpm db:rollback` (local) or the manual production revert
procedure in
[migrations.md](../guides/migrations.md#manual-revert-in-production).
The expand step is always safe to roll back — nothing depends on it.
The contract step is the destructive one; roll forward with a
fix-forward migration rather than attempting a contract rollback
once data has been discarded.

## Feature-flag rollout pattern

Depends on **#18** (the `feature_flags` table). Until that migration
lands the rollout below is conceptual; once it ships, use this as the
canonical pattern.

- **Schema shape.** One row per flag keyed by a string `name`, with an
  audience descriptor that the app resolves at request time — one of:
  a user-id allowlist, an organization allowlist, or a percentage
  rollout (hash of user-id → bucket).
- **Default off.** New flags are created with the feature disabled for
  everyone. Ship the code gated behind the flag first; the code path
  is cold in Production until someone flips the flag on.
- **Rollout sequence.**
  1. Enable for the engineer's own user-id via the user allowlist.
     Verify the flow end-to-end against Production.
  2. Enable for a small internal org allowlist (e.g. the Last Rev
     team). Let it soak for at least one business day.
  3. Ramp the percentage rollout: 1% → 10% → 50% → 100%, with a
     monitoring window between each step. Hold at the current
     percentage if error rate or latency regress.
- **Kill switch.** Because the code path is gated on a runtime
  database read, flipping the flag row back to `disabled` fully
  reverts behavior without a redeploy. This is the preferred rollback
  when a feature misbehaves in Production. Verify the kill switch on
  staging before trusting it in Production.
- **Caching note.** If the flag is read on a hot path, cache it per
  request (not per process) — otherwise a killed flag takes the cache
  TTL to propagate.

## Vercel traffic splitting for canary deploys

Vercel's primary canary primitive is the deployment alias. Every
deployment has a stable URL; the Production alias
(`apps.lastrev.com`) points at whichever deployment is promoted.
Rolling back is "re-alias the previous deployment."

For the subset of changes that warrant a staged rollout (new
webhook-handling logic, major proxy / registry changes, schema
consumers during an expand-contract sequence):

1. **Deploy to a preview URL.** Every PR gets one automatically.
   Smoke-test via the preview URL before even thinking about
   promotion.
2. **Promote to staging.** Merge to the staging branch so
   `staging.apps.lastrev.com` picks up the change. Let it soak under
   internal traffic and the staging webhook fixtures.
3. **Promote to Production.** Merge to `main`. The Production alias
   cuts over per the rolling-deploy semantics above.
4. **Monitoring window.** Watch error rates, webhook 5xx counts, and
   Supabase query volume for the first 10–30 minutes post-promotion.
   Keep the previous deployment un-retired during this window.
5. **Rollback.** If the monitoring window shows regression, re-alias
   the previous deployment (Vercel dashboard → Deployments → "…" →
   **Promote to Production**). This is a single-click, seconds-scale
   revert and the safest option before touching data.

Vercel also supports percentage-based traffic splitting between two
deployments on the same project (Settings → Traffic). Use this for
changes where staging cannot reproduce Production load:

- Configure the split before promotion so the new deployment receives
  1–5% of traffic while the previous one serves the rest.
- Widen the percentage in the same 1 → 10 → 50 → 100 ramp as the
  feature-flag rollout. The monitoring window at each step should
  cover at least one full minute of traffic.
- Percentage splits are incompatible with sticky sessions — a user
  can hit either deployment across navigations. Keep session state in
  the Auth0 cookie (shared across deployments) and avoid per-deployment
  in-memory caches for anything user-visible.

## See also

- [vercel-promotion.md](./vercel-promotion.md) — env-var promotion
  flow and which vars must differ per env.
- [migrations.md](../guides/migrations.md) — pairing rule, local
  rollback, manual production revert.
- [disaster-recovery.md](./disaster-recovery.md) — Stripe webhook
  event replay, Supabase PITR, Auth0 tenant restore.
- [preview-deployments.md](./preview-deployments.md) — how to smoke a
  change on a preview URL before promoting.
