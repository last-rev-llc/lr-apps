# Session Summary: session/023-crm-app-promotion-from-command-center-users-to-standalone

## Overview
Promoted a CRM app out of `command-center/users` into a standalone subdomain-routed app across 20 issues, all succeeding on first pass with zero test-fix retries. Work spanned scaffolding (registry, route group, migration), porting (queries, types, components, server actions, AI enrich route), wiring (page mount, dialogs, form), and cutover (delete old route, redirect stub, test-fixture sync). Total runtime 66 min at ~199s/issue with the full 1240-test suite green throughout.

## Recurring Patterns
- **`pnpm create-app <slug> --template=full`** is the canonical zero-touch path for new apps — registry, route group, layout with `requireAppLayoutAccess`, and tests in one shot.
- **Three-site lockstep updates** when promoting/removing a sub-app: parent's MODULES array, parent's `EXPECTED_MODULES` test fixture, and the old route converted to a `redirect()` stub.
- **Server-action test recipe**: `vi.mock('@repo/db/server')` with chainable builder + assert exact `revalidatePath` argument + assert span name (`crm.<action>`). Now used by ideas, meme-generator, crm.
- **Schema-first AI generation**: define Zod schema (`InsightsSchema`), then `generateObject({ schema, ... })` enforces the shape — no manual JSON parsing.
- **Idempotent migrations**: `create ... if not exists` + `do $$ ... exception when duplicate_object then null; end $$` for policies; down-migrations drop only newly created objects when the table predates the repo.
- **Module-level `vi.mock('@ai-sdk/anthropic')`** with fixture matching the schema cleanly tests AI route handlers without network calls.

## Recurring Anti-Patterns
- **`revalidatePath('/')` in subdomain-routed apps** — surfaced in 6+ issues (#338, #339, #340, #341, #342, plus reviews of #336/#337). Must use Next.js filesystem route (`/apps/<slug>`), not the user-facing URL. Tests asserting only "was called" miss this; assert the exact path argument.
- **Dead-code wiring gaps**: shipping `page.tsx` as `<h1>CRM</h1>` placeholder and child components as `return null` stubs while real lib code passes its own tests (#333, #334, #335, #336, #337). Tests targeting the new component pass even when the page never imports it.
- **Page tests that lock in placeholder text** rather than asserting the routed page actually mounts the consuming component — silently mask the dead-code bug.
- **`(supabase as any)` casts** propagating across new server actions/routes (#343, #344, #345, #346, #347) — repo-wide pattern, but each instance compounds lint-warning debt.
- **Acceptance-criteria/diff mismatch** marked "success" (#329, #347): wrong files changed or manual verification steps skipped while automated gates pass.
- **Stale audit artifacts** (`docs/token-violations-report.md`) referencing deleted paths — not regenerated in the same change.

## Recommendations
- **Add a CLAUDE.md non-negotiable** under #4 (proxy.ts ownership): "`revalidatePath` always takes the Next.js filesystem route (`/apps/<slug>`), never the user-facing subdomain URL. Tests must assert the exact path argument, not just `toHaveBeenCalled()`."
- **Update the implement prompt** to require an end-to-end reachability check before declaring success: for any issue that adds a component/route/server action, grep that the new symbol is imported/mounted somewhere on the routed page tree, not just that the file exists and tests pass.
- **Update the review prompt** to flag (a) `page.tsx` files containing placeholder JSX (`<h1>` with hardcoded slug name and no data fetch), and (b) new components returning `null` as their entire render. Both are dead-code smells.
- **Update the planning prompt** to add a pre-flight check: planned file changes must intersect the paths/scripts named in the issue's acceptance criteria. Flag mismatches before coding (#329 lesson).
- **Add a lint rule or scripts/ check** for `revalidatePath('/')` and `revalidatePath('/contacts')`-style patterns inside `app/apps/*/lib/actions.ts` — fail if the argument doesn't start with `/apps/`.
- **Strengthen page.test.tsx scaffolding** in `pnpm create-app`: assert the page mounts a named child component (e.g. `<CrmApp>`), not just placeholder copy, so the test breaks once real wiring is required.
- **Auto-regenerate `docs/token-violations-report.md`** as part of `pnpm audit:tokens` in the lint pipeline so deleted-path references can't go stale.
- **Add a "manual verification" gate** to the success criteria evaluator: if the issue lists browser smoke steps and no verification output was captured, downgrade from `success` to `success-pending-manual` rather than green-lighting silently (#329, #347).

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 20 |
| Success rate | 100% |
| Avg duration | 199s |
| Total duration | 66 min |
