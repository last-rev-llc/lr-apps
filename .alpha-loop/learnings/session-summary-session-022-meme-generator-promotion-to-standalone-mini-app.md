# Session Summary: session/022-meme-generator-promotion-to-standalone-mini-app

## Overview
13 issues shipped in a single pass with zero test-fix retries, promoting the Meme Generator from a command-center sub-route to a standalone mini-app while adding quota enforcement, AI caption gating, library management, and full E2E coverage. All 1173 web tests stayed green throughout, and reviews caught two notable wiring gaps (most importantly a producer/consumer mismatch on `?meme=<id>` deep-linking) that were fixed in-band.

## Recurring Patterns
- `vi.hoisted()` for shared mocks across `@repo/storage`, `@repo/billing`, and lib modules — keeps mock identity stable across test reorderings and new mocks layered onto existing files.
- In-memory Supabase query builder mock with `pendingInsert`/`pendingUpdate`/`pendingDelete`/`countMode` flags cleanly models chained-builder semantics for unit tests.
- Extracting AI provider calls into thin `lib/ai-*.ts` modules so server actions can be tested without re-mocking `generateObject`; matches existing `ideas/lib/ai-plan` and `cringe-rizzler` deterministic-stub patterns.
- Boundary-level enforcement tests at the helper layer (e.g. `enforce-feature-tier.test.ts`) that cover all tiers (free/pro/enterprise) — fast, isolated from billing/storage mocks.
- Optimistic mutation pattern (snapshot → apply → await → revert on throw) verified with explicit "restores on failure" tests.
- Promotion-to-subdomain cleanup checklist: remove from `MODULES` array + remove from `EXPECTED_MODULES` test fixture + add negative `queryByText` assertion + delete orphaned `__tests__/<feature>.test.tsx` files in the source app.
- Structured warn-level logging (e.g. `feature='meme-generator', phase='delete-blob'`) doubles as observability and as test signals for boundary conditions.
- Network-level mocking via Playwright `page.route()` for AI endpoints, with route-level abort of `api.anthropic.com` as defense-in-depth.

## Recurring Anti-Patterns
- **Producer/consumer mismatch on URL params**: shipping a deep-link affordance (`?meme=<id>`) without verifying the destination page reads `searchParams` and seeds initial state — appeared in #319, #320, #321, #322. Unit tests on the sender pass while the round-trip silently no-ops.
- **AC checklist over-reliance**: passing tests + checked ACs masked critical wiring gaps because no integration test exercised the full producer→consumer flow for navigation params.
- **Scope inflation**: issue #324 mixed test-coverage work with unrelated standalone-app promotion edits (command-center test deletion, MODULES list edits), making review harder.
- **Hardcoded counts next to dynamic arrays**: `"21 Routes"` literal next to `MODULES.length` drifts on every promotion.
- **Component-identity coupling in tests**: insisting on literal `<UpgradePrompt>` component matching when an inline `Dialog` renders the same `quotaUpgradeCopyForTier()` copy locks in incidental component choices instead of asserting user-visible behavior.
- **Ad-hoc query-builder growth**: `makeQuery` chainable in `actions.test.ts` grew to ~150 lines supporting select/insert/update/delete/single/maybeSingle/count — should be extracted to a shared fake before the next action lands.

## Recommendations
- **Update the implement prompt** to require, whenever a feature emits a navigation/query-string handoff, that the same change wires the consumer (page reads `searchParams` → passes prop → component seeds initial state) AND adds an integration test asserting the seeded state. Treat any new URL param as producer + consumer + round-trip test, not just producer.
- **Update the review prompt** to explicitly check: "for every URL param or query-string produced in this diff, is there a consumer reading it, and is there a test for the round-trip?" This single check would have caught issues #319–#322 before review.
- **Extract a shared Supabase query-builder fake** into `@repo/test-utils` (or `apps/web/lib/test-utils`) before the next action-heavy feature; current per-file forks are converging on the same shape and will diverge if not unified.
- **Add a "promotion-to-subdomain" checklist skill or doc** capturing the now-proven cleanup pattern: MODULES array, EXPECTED_MODULES fixture, negative label assertion, orphan test deletion, hardcoded count audit. Reusable for the next promotion.
- **Update the plan prompt** to flag scope-mixing: if an issue's stated goal is "test coverage" but the diff would also touch unrelated registry/layout files, split into two PRs or call out the bundling explicitly in the plan.
- **Pin module counts to `MODULES.length`** in the command-center layout/page rather than hardcoded literals — eliminates drift on every future promotion.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 13 |
| Success rate | 100% |
| Avg duration | 307s |
| Total duration | 67 min |
