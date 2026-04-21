# Session Summary: session/017-cleanup-backlog

## Overview
All four issues completed successfully on first attempt with zero test-fix retries, totaling 29 minutes. The session bundled a CLAUDE.md sync-check (#230) with three Age of Apes UI migrations (#227, #228, #229) into a single batch PR, with all 810 web tests passing and lint problems dropping from 284 to 282.

## Recurring Patterns
- **Marker-delimited doc sections + CI sync script** (`<!-- lib-listing:start/end -->`) for enforcing doc/code consistency — appeared in #228, #229, and #230 as a clean pattern.
- **Pair `@repo/ui` primitive migration with component tests in the same PR** to lock in functional equivalence between hand-rolled and shared components (#227, #228, #229).
- **Preserve app-specific styling via `className`/`style` overrides** on shared primitives rather than extending the design system for one-off needs (#227, #228).
- **Triage review-issue findings into fix/won't-fix/superseded before coding** to keep scope tight to the AC (#229).

## Recurring Anti-Patterns
- **Deleting `review-issue-*.json` files without explicitly deferring info-severity findings** — flagged in all four issues (#227, #228, #229, #230). Three findings from `review-issue-68.json` (component keyframes in global CSS, glass-input rgba vs oklch, shadow-glow light-theme tokens) appear to have been silently dropped.
- **Migrating to `@repo/ui` primitives that don't exist yet** (Checkbox, Select) instead of retaining native elements + filing a follow-up (#227, #229).
- **Scope creep across issues in the batch** — #230's CI-check scope was mixed with #227/#228/#229's UI migration work in a single PR (#230 explicitly called this out).
- **Thin local shims around `@repo/ui` primitives** that just re-forward props add indirection without value (#228).

## Recommendations
- **Update the implement prompt to require explicit handling of `review-issue-*.json` findings before deletion**: each info-severity item must be either addressed in the PR, listed under a "Deferred" section in the PR description, or filed as a follow-up issue. Block deletion of the JSON file otherwise.
- **Add a pre-implementation check that verifies referenced `@repo/ui` exports actually exist** — if a primitive is missing, the plan should call out "retain native + file follow-up" rather than discovering the gap mid-implementation.
- **Update the batch PR workflow to flag scope-mixing**: when issues in a batch span unrelated subsystems (CI scripts vs. app UI), the planner should recommend separate PRs or explicitly justify the bundling in the PR description.
- **Add a lint rule or implement-prompt instruction against thin pass-through wrappers** around `@repo/ui` components — consume primitives directly unless the wrapper adds real behavior.
- **File a tracking issue for the three deferred `review-issue-68.json` findings** before this session is closed out, so they don't get lost.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 4 |
| Success rate | 100% |
| Avg duration | 435s |
| Total duration | 29 min |
