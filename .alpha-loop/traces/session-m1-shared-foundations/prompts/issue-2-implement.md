Implement GitHub issue #2: Create  package

## Summary
Scaffold the `@repo/billing` package with Stripe customer creation, subscription management helpers, webhook handler, and `hasFeatureAccess()` server utility. This is infrastructure-only — no app-level gating or paywalls.

## Details
- Stripe customer creation and subscription management helpers
- Webhook handler at `/api/webhooks/stripe`
- `hasFeatureAccess(userId, feature)` server utility
- New `subscriptions` table via `@repo/db`
- No app-level gating — plumbing only

## Acceptance Criteria
- [ ] `packages/billing/` exists with `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] `src/stripe-client.ts` — Stripe singleton with env var validation
- [ ] `src/customers.ts` — `getOrCreateCustomer(userId, email)` with tests
- [ ] `src/subscriptions.ts` — `upsertSubscription()` and `getSubscription(userId)` with tests
- [ ] `src/has-feature-access.ts` — tier hierarchy check (free < pro < enterprise) with tests
- [ ] `src/webhook-handler.ts` — handles `customer.subscription.created/updated/deleted` with tests
- [ ] `src/types.ts` — `Tier`, `Subscription`, `SubscriptionStatus`, `WebhookEvent` types
- [ ] `src/index.ts` barrel exports all public API
- [ ] All tests pass via `pnpm test --filter=@repo/billing`
- [ ] `subscriptions` table migration SQL documented in `supabase/migrations/`
- [ ] Stripe env vars added to `turbo.json` globalEnv


## Discussion (issue comments)
- **@spindle79** (2026-04-07T22:42:53Z): Agent loop failed: could not create worktree. Check logs.


## Implementation Plan
1. Create packages/billing/package.json: name @repo/billing, private, type module, exports '.' -> ./src/index.ts. Dependencies: stripe. DevDependencies: @repo/config, @repo/db (workspace:*), vitest, typescript. Scripts: test -> vitest run. Follow @repo/auth conventions.

2. Create packages/billing/tsconfig.json: extend @repo/config/tsconfig/base, outDir dist, include src.

3. Create packages/billing/vitest.config.ts: minimal vitest config with test include src/**/*.test.ts.

4. Create src/types.ts: Define Tier enum ('free' | 'pro' | 'enterprise'), SubscriptionStatus ('active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'), Subscription interface (id, user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_start, current_period_end, created_at, updated_at), WebhookEvent type wrapping Stripe event types for customer.subscription.created/updated/deleted.

5. Create src/stripe-client.ts: Export getStripe() singleton that validates STRIPE_SECRET_KEY env var exists, creates and caches Stripe instance with api version.

6. Create src/customers.ts: Export getOrCreateCustomer(userId, email). Uses @repo/db service-role client to check subscriptions table for existing stripe_customer_id by user_id. If found, return it. If not, call stripe.customers.create({ email, metadata: { userId } }), insert row into subscriptions with tier 'free', return customer id.

7. Create src/subscriptions.ts: Export upsertSubscription(stripeSubscription) that maps Stripe subscription object to DB row (extract tier from price metadata or product), upserts into subscriptions table by stripe_subscription_id. Export getSubscription(userId) that queries subscriptions table by user_id, returns typed Subscription or null.

8. Create src/has-feature-access.ts: Export hasFeatureAccess(userId, feature). Define tier hierarchy map: { free: 0, pro: 1, enterprise: 2 }. Define feature-to-minimum-tier map (e.g., basic -> free, advanced -> pro, custom -> enterprise). Get user subscription via getSubscription, compare tier rank against required tier. Return boolean.

9. Create src/webhook-handler.ts: Export handleStripeWebhook(body, signature). Verify webhook signature using STRIPE_WEBHOOK_SECRET env var. Switch on event type: customer.subscription.created/updated -> call upsertSubscription, customer.subscription.deleted -> update subscription status to 'canceled'. Return { received: true }.

10. Create src/index.ts: Barrel export all public API from customers, subscriptions, has-feature-access, webhook-handler, types, stripe-client.

11. Update packages/db/src/types.ts: Add Subscription table type to Database interface with Row/Insert/Update variants matching the subscriptions table schema.

12. Create supabase/migrations/002_subscriptions.sql: CREATE TABLE public.subscriptions with columns: id uuid PK default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, stripe_customer_id text, stripe_subscription_id text unique, tier text not null default 'free' check (tier in ('free','pro','enterprise')), status text not null default 'active', current_period_start timestamptz, current_period_end timestamptz, created_at timestamptz default now(), updated_at timestamptz default now(). Add unique constraint on user_id. Enable RLS. Add policy for users to read own subscriptions. Add index on user_id. Add index on stripe_customer_id.

13. Update turbo.json: Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to globalEnv array.

14. Write tests: customers.test.ts — mock Stripe and Supabase, test getOrCreateCustomer returns existing customer and creates new one. subscriptions.test.ts — test upsertSubscription maps Stripe data correctly, test getSubscription returns null when no subscription. has-feature-access.test.ts — test tier hierarchy (free user denied pro features, pro user granted pro features, enterprise gets everything, missing subscription defaults to free). webhook-handler.test.ts — mock stripe.webhooks.constructEvent, test each event type routes to correct handler, test invalid signature throws.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Execution error


## Scope Rules (CRITICAL)
- ONLY modify files directly related to this issue
- If tests fail due to environment issues (missing venv, wrong port, missing deps), report it — do NOT rewrite test infrastructure
- Do NOT fix unrelated code, even if you notice problems
- Do NOT modify dev server config, build config, fonts, or styling unless the issue specifically requires it
- If the issue lists "Affected Files/Areas", stay within that scope

## Before You Start
1. Read the product vision and technical context above
2. Make decisions that align with the target users and current priority
3. Understand how your changes connect to existing code
4. If you're creating new files, make sure they're wired into the appropriate entry points

## After Implementing
1. Write tests for your changes
2. Run the test command to verify
3. Commit with: git commit -m "feat: Create  package (closes #2)"