# Session Summary: session/027-alpha-wins-e2e-tests

## Overview
Two alpha-wins E2E test issues (#419, #421) shipped clean: both passed on first run with zero fix retries and no review findings. The session reused existing fixtures/helpers exclusively and split permission-mutating cases from stable-state interaction cases across separate spec files.

## Recurring Patterns
- **Reuse shared fixtures over creating new ones** — both specs used `unauthPage`/`loggedInPage` and `seedPermission`/`deletePermission` helpers without introducing new infra.
- **Split spec files by state-mutation profile** — access/gating cases (which mutate permissions) live in `access.spec.ts`; interaction cases (which assume stable permissions) live in a sibling spec. Prevents cross-test leakage and keeps cases order-independent.
- **Symmetric permission lifecycle** — `beforeAll` seeds, mid-suite delete/re-seed where required, `afterAll` cleans up, leaving the environment as found.
- **Credential-aware skip guards** — `test.skip(!credentialsPresent(), ...)` plus a hard throw in `userId()` keeps suites runnable without E2E creds while failing loudly under partial config.
- **Derive expected values from production data** — importing `wins.json` directly into the spec keeps assertions synced with the source.
- **Scope selectors via `[aria-label="..."]` wrappers** to disambiguate filter rows from card-internal text without resorting to `data-testid`.

## Recurring Anti-Patterns
- **Don't escalate registry-declared permission roles** (e.g., `view` → `edit`) to make tests pass.
- **Don't shortcut gating tests** by adding the slug to `APP_SELF_ENROLL_SLUGS` — that defeats the gate under `next start`.
- **Don't add `data-testid` hooks** when existing role/text/aria-label selectors already disambiguate (unit tests prove stability).
- **Don't co-locate permission-mutating cases** with stable-state cases in the same spec file.

## Recommendations
- **Codify the spec-split convention** in the e2e bootstrap skill (`.claude/skills/lr-app-e2e-bootstrap/`): "permission-mutating cases → `access.spec.ts`; stable-state interaction cases → `gallery.spec.ts` (or feature-named sibling)."
- **Add a planning checklist item**: "Confirm the registry-declared permission role before drafting cases — do not escalate to make a case pass."
- **Add a planning checklist item**: "Prefer `[aria-label="..."]` wrapper scoping over new `data-testid` attributes when disambiguating selectors."
- **Document the credentials-guard idiom** (`credentialsPresent()` skip + `userId()` hard-throw) as the canonical pattern in the e2e skill so future specs adopt it without re-deriving.
- **Encourage importing production data fixtures** (e.g., `wins.json`) directly into specs to derive expected counts/badges — flag in the implement prompt as a default for data-driven assertions.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 2 |
| Success rate | 100% |
| Avg duration | 322s |
| Total duration | 11 min |
