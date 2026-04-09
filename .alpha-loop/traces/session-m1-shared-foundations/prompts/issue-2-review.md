Review the code changes for issue #2: Create  package

Run git diff origin/main...HEAD to see what changed. Then read the actual files that were modified.

Original requirements:
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

Discussion (issue comments):
- **@spindle79** (2026-04-07T22:42:53Z): Agent loop failed: could not create worktree. Check logs.


## Product Vision (guide your review decisions)
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.


## Review Checklist

### 1. Functional Completeness (MOST IMPORTANT)
- Does the implementation FULLY address the issue requirements?
- Are there any acceptance criteria that were NOT implemented?
- If backend API endpoints were created, are they called from the frontend?
- If frontend components were created, do they have working backend endpoints?
- Are there any dead code paths (created but never wired in)?
- Does the feature work end-to-end (data flows from UI → API → database → back to UI)?

### 2. Dependency Wiring (CRITICAL — most common source of silent failures)
- For every service, repo, or dependency the new code USES:
  1. Is it instantiated somewhere? (e.g., in a bootstrap function, DI container, or factory)
  2. Is it actually PASSED to the consumer? Check function call sites — not just that the parameter exists.
  3. RED FLAG: If a parameter defaults to None and code guards with "if x is not None" — this may silently hide missing injection. The guard makes tests pass but the feature is dead.
- For new routes: Are static routes (e.g., /evals/compare) registered BEFORE parameterized routes (e.g., /evals/{id})? Parameterized routes shadow static ones in most frameworks.
- For new data consumers (scripts, eval engines, dashboards): Trace the data back to its source. If a script queries a table, verify that something actually WRITES to that table in the production pipeline.
- For metrics and cost tracking: Are values computed from real data or estimated/hardcoded? Hardcoded "0" or len()//4 estimates violate data accuracy if displayed as real metrics.

### 3. Code Quality
- Security issues (injection, XSS, auth bypass)
- Missing error handling for user-facing operations
- Missing tests for new functionality
- Code follows project conventions

### 4. Documentation Sync
- If CLI commands were added/changed: is README.md updated? CLAUDE.md? --help text in cli.ts?
- If config options were added/changed: is README.md Configuration Reference updated?
- If directory structure changed: is CLAUDE.md Directory Structure updated?
- Never leave docs referencing commands, options, or paths that no longer exist.

### 5. UX Review
- Do UI changes match the target user profile?
- Are error states handled (loading, empty, error)?
- Is the feature discoverable (can users find it)?

## Actions

For any issues you find:
- CRITICAL (gaps, missing wiring, broken features): FIX THEM directly, run tests, commit with "fix: address review findings for #2"
- WARNING (quality, security): FIX THEM directly if possible
- INFO (suggestions, minor improvements): Note them in your report but don't block

## Gate Result (REQUIRED)

After your review, write a JSON file to: review-issue-2.json

The file must contain ONLY valid JSON with this exact schema:

{
  "passed": true,
  "summary": "One-line summary of review outcome",
  "findings": [
    {
      "severity": "critical",
      "description": "What the issue is",
      "fixed": true,
      "file": "path/to/affected/file.ts"
    }
  ]
}

Rules:
- passed: true if all critical/warning issues were fixed. false if any remain unfixed.
- findings: list ALL issues found, with fixed=true for ones you fixed, fixed=false for ones you could not fix.
- severity: "critical" for blockers, "warning" for should-fix, "info" for notes.
- If you fixed everything and the code is clean, set passed=true with an empty findings array.
- If there are unfixed critical/warning issues, set passed=false — the implementer will be sent back to fix them.