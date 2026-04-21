# Session Summary: session/20260420-225002

## Overview
Session processed 2 issues over ~2.5 hours with a 50% success rate. The successful issue (#67) delivered a CI/CD pipeline with coverage reporting, but shipped with 22 pre-existing lint errors that would block the very pipeline it created. The failed issue details are absent from the learnings, leaving only one data point for pattern analysis.

## Recurring Patterns
- Agent is capable of fixing lint/type errors it encounters during development, but does not proactively scan for the full scope of violations introduced by tooling changes
- CI infrastructure work (pipelines, linting, coverage) requires end-to-end verification that the pipeline itself passes — not just that the new code is correct

## Recurring Anti-Patterns
- **Declaring completion without full-pipeline verification**: The agent marked CI setup done while `pnpm lint` still fails with 22 errors, meaning the delivered PR contradicts its own acceptance criteria
- **Partial cleanup is worse than no cleanup**: Fixing some lint errors but not all leaves the pipeline in a broken state that actively blocks all future PRs
- **Tooling scope changes not audited**: Switching from `next lint` to `eslint .` broadened the linter's reach without a corresponding audit of newly-surfaced violations

## Recommendations
- **Add a "pipeline self-test" gate to the implement prompt**: When the task involves CI, linting, or build config, the agent must run the full pipeline locally and confirm zero failures before marking the task complete
- **Require scope-change audits**: When switching tools (e.g., `next lint` → `eslint .`), the implement prompt should mandate running the new tool across the entire codebase and either fixing all violations or adding explicit exclusions
- **Treat acceptance criteria as pass/fail checks**: Update the review prompt to literally verify each acceptance criterion rather than accepting "mostly done" — if the criterion says "all checks pass," the reviewer must confirm the checks actually pass
- **Surface the second issue's failure**: The failed issue produced no learnings — add error capture so failed issues still generate traces and patterns for analysis

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 2 |
| Success rate | 50% |
| Avg duration | ~4369s |
| Total duration | 146 min |
