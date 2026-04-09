Analyze this GitHub issue and produce a structured implementation plan.

Issue #2: Create  package

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

Write a JSON file to: plan-issue-2.json

The file must contain ONLY valid JSON with this exact schema:

{
  "summary": "One-line description of what needs to be done",
  "files": ["src/path/to/file.ts", "..."],
  "implementation": "Concise step-by-step plan. What to create, modify, wire up. No issue restatement.",
  "testing": {
    "needed": true,
    "reason": "Why tests are or aren't needed for this change"
  },
  "verification": {
    "needed": false,
    "instructions": "If needed: specific playwright-cli steps to verify the feature. If not needed: omit this field.",
    "reason": "Why verification is or isn't needed (e.g. no UI changes, API-only, config change)"
  }
}

Rules:
- testing.needed: true if ANY code changes could affect behavior. false only for docs, config, or comments.
- verification.needed: true ONLY if the issue changes user-visible UI that can be tested in a browser.
- verification.instructions: if needed, list the exact playwright-cli commands to verify (open URL, click elements, check content).
- implementation: be concise and actionable. List files to modify and what to change in each.
- Write ONLY the JSON file. Do not create any other files or make any code changes.