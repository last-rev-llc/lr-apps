# Session Summary: session/021-ideas-app-promotion-to-standalone-mini-app

## Overview
A 19-issue batch successfully promoted the Ideas feature from a sub-route under `command-center` to a standalone mini-app at `apps/ideas`, including DB migration, server actions with AI planning, UI components, token cleanup, e2e tests, and proxy redirects for legacy URLs. All 19 issues passed on first run with zero test-fix retries; the test suite grew from 967 to 1030 tests across the session, all green.

## Recurring Patterns
- **Hoisted UUID test constants** via `vi.hoisted(() => ({ TEST_USER_ID, OTHER_USER_ID }))` shared between `vi.mock` factories and assertions without TDZ issues — reused across every action test suite.
- **In-memory Supabase mock builder** with chainable `.eq()/.order()/.single()/.maybeSingle()` shape mirroring PostgREST — reusable template that handled all 50 action tests deterministically.
- **Cross-issue consistency review** caught a real `completedAt` data-loss bug where `setIdeaStatus('archived')` cleared the field while `archiveIdea` preserved it — both paths reconciled with locked-in test coverage.
- **Three-step env-var propagation** (turbo.json `globalEnv` + typed entry in `apps/web/lib/env.ts` + zero direct `process.env` reads) applied cleanly for `ANTHROPIC_API_KEY`.
- **AI server-action template**: `generateObject` + zod schema → derive composite locally → atomic `(id, user_id)` scope → `withSpan` wrap → `hasFeatureAccess` gate → deterministic stub fallback when API key unset.

## Recurring Anti-Patterns
- **Migration filename drift** — issue specs repeatedly used `<name>.up.sql` while repo convention is plain `<name>.sql`. The agent correctly deviated each time, but the issue authoring step keeps producing the wrong spec.
- **Dead code carried across file moves** — unused `SOURCE_COLORS` const migrated verbatim from legacy directory; the move was the cheapest moment to drop it.
- **`instanceof` across the RSC boundary** — `RateLimitedError` / `FeatureAccessError` thrown from server actions don't survive Next.js production sanitization; client branching needs a stable `code` field on the error message.
- **Scope mismatch on cleanup issues** — token cleanup in #302 hit only `ideas-app.tsx` while four sibling components in the same directory still carry `text-white/N` and `var(--color-X)` patterns.
- **Duplicate sources of truth** — `FEATURE_LABELS` (tier-config) and `FEATURE_TIER` (@repo/billing) encode the same gate mapping with no consumer of the new map; drift-prone.
- **Playwright accessible-name pitfalls** — icon-only buttons relying on `title` instead of `aria-label`; unscoped `getByRole({ name: /^all$/i })` failing strict mode against duplicate pills.
- **`audit-tokens.ts` blind spots** — script flags Tailwind palette + hex/rgb/oklch literals but misses `text-white/<n>` opacity utilities and `var(--color-X)` inline styles; "audit passes" ≠ full token compliance.
- **Server action without UI exerciser** — `planAndScoreIdea` shipped while `ideas-app.tsx:327` still has a TODO no-op button, leaving no end-to-end smoke test in the same batch.
- **Critical skill checklist deletions** — multiple issues (#293, #299, #301) silently deleted 8+ incident-derived items from `code-review/SKILL.md` capturing recurring bug classes (#147–#216), bundled into unrelated work without justification.

## Recommendations
- **Restore deleted `code-review/SKILL.md` items** at `.alpha-loop/templates/skills/code-review/SKILL.md` — CI guard integrity, runtime-claim wiring, cross-runtime API audit, DOM data-attribute readers, cache write/read pairing, env var propagation to `turbo.json`, primary-deliverable grep, non-null assertion narrowing, integration-test naming. These captured 5+ recurring incidents each and should not be deleted as side effects of unrelated PRs.
- **Update issue-authoring prompt** to grep `supabase/migrations/` before specifying migration filenames — the `.up.sql` suffix drift recurred across all 5 migration-touching issues.
- **Add to `code-review` skill**: (1) cross-action terminal-state consistency check (grep all writers of an enum value, verify identical companion-field handling); (2) AC scope coverage across sibling files when AC names a glob like `X/**`; (3) `audit-tokens.ts` blind-spot reminder (white-opacity utilities, `var(--color-)` inline styles).
- **Add to `test-robustness` / `playwright-cli` skill**: icon-only buttons need `aria-label` (subtree emoji beats `title` per W3C accessible-name calc); ambiguous role-name queries need `.first()`/`.last()` or parent scoping under strict mode.
- **Add to `claude-api` or new `nextjs-server-actions` skill**: custom error classes thrown from server actions need a stable `code`/message discriminator because `instanceof` does not survive the RSC boundary in production.
- **Update implement prompt** to require dropping clearly-unused exports during file moves (e.g., the `SOURCE_COLORS` pattern), since a move has no external callers to break.
- **Update implement prompt** to require either wiring a server action's UI invoker in the same batch or filing an explicit follow-up — `planAndScoreIdea` shipped without its button across 3 issues.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 19 |
| Success rate | 100% |
| Avg duration | 281s |
| Total duration | 89 min |
