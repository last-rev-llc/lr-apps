# Plan: E2E tests for the HSPT Practice app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra (Playwright at `apps/web/playwright.config.ts`, `loggedInPage` fixture in `tests/e2e/fixtures/auth.fixture.ts`, `seedPermission` in `tests/e2e/helpers/db.ts`) is reused. HSPT Practice is a **client-only quiz** — questions live in static `data/questions.json`, sessions persist to `localStorage` only. No Supabase tables, no server actions, no migrations. That dictates the scope below.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by the auth fixture.
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — needed for `seedPermission` only.
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`.
- **Permissions**: registry entry requires `view` (not `edit`). In `beforeAll` call `seedPermission(userId, "hspt-practice", "view")`. Tear down with `deletePermission` in `afterAll`.

## 2. Test data strategy

**No `helpers/hspt-practice.ts` is needed.** The app has zero server-side persistence — every session is written via `localStorage.setItem("hspt_sessions", ...)` from `components/practice-app.tsx`. Reading the DB to assert state would assert nothing.

When a future test needs deterministic session history (e.g. to drive the History view), use Playwright's `page.addInitScript` to pre-seed `localStorage.hspt_sessions` before navigation. That keeps the seam in-browser, where the data actually lives.

Why no DB seeding helpers: server-action unit tests don't exist for this app either (see `__tests__/layout.test.tsx`, `components/__tests__/practice-app.test.tsx`, `lib/__tests__/sections.test.ts` — all client/unit). E2E adds nothing by re-touching Supabase.

## 3. Use-case catalog (test inventory) — Group A only

Per the rules, minimal-template apps stay tight. Group A (access & gating) is the highest-value smoke layer; further groups (quiz flow, results, history) are explicitly **deferred** — see §6.

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/hspt-practice` redirects to login (Auth0 universal login URL).
2. Auth user without `hspt-practice` permission → `/unauthorized` page (registry sets `auth: true`, `permission: "view"`, no self-enroll).
3. Auth user with `hspt-practice:view` → page renders the layout header (`📝 HSPT Practice`) and the section menu heading "Choose a Section".
4. All five section tiles render in the menu — verify Verbal, Quantitative, Reading, Mathematics, Language by `data-testid="section-tile-${id}"` (added in §4).
5. Empty-state copy "No practice sessions yet — start your first one!" is visible when `localStorage.hspt_sessions` is unset.

That's the floor. Tier is `free`, so no billing-gate test exists; `features: {}` means no feature-flag dialogs to check.

## 4. Selector strategy (do this before writing specs)

Today the menu/quiz views are identified only by emoji + text — brittle once copy or icons change. Add `data-testid` hooks in `components/practice-app.tsx` only where the access tests touch:

- `section-tile-${id}` on each `SectionMenu` button (id = `verbal | quantitative | reading | mathematics | language`).
- `app-header` on the `<header>` in `layout.tsx` so the access spec asserts the chrome rendered, not just the page body.
- `recent-sessions-empty` on the empty-state Card in `SectionMenu`.

Skip testids for Quiz/Results/Review/History components until those groups are in scope — adding hooks we don't exercise is dead weight.

## 5. Spec organization

```
apps/web/tests/e2e/hspt-practice/
  access.spec.ts           # Group A — the only file for this milestone
```

Single file. `beforeAll` seeds permission; no `afterEach` data cleanup needed (no DB rows). Use `page.context().clearCookies()` / fresh context for the unauth case via the existing `unauthPage` fixture.

## 6. Out of scope (explicitly deferred)

- **Quiz flow / timer / scoring**: requires faking `Date.now`, `setInterval`, and `Math.random` (the section uses `shuffle()`). Belongs in a Vitest unit suite against `PracticeApp`, not Playwright — already partially covered by `components/__tests__/practice-app.test.tsx`.
- **Results / Review / History views**: depend on a completed session; once Quiz flow is wired (with a deterministic seed + frozen clock), these get a single `quiz-flow.spec.ts` in a follow-up.
- **localStorage persistence assertions**: reachable via `page.evaluate(() => localStorage.getItem("hspt_sessions"))`, but only meaningful once the quiz flow test exists to produce the value.
- **Recharts rendering in History**: visual/regression territory — separate effort.

## 7. Running

- `pnpm --filter web test:e2e` (script already exists or mirrors the Ideas plan).
- Local: dev server reused (`reuseExistingServer: !CI`).
- CI: `webServer.env.APP_SELF_ENROLL_SLUGS` does **not** include `hspt-practice` and shouldn't — the negative-permission test (A2) depends on self-enroll being closed for this slug. Rely on `seedPermission` for the positive cases.

---

## Execution order

1. Add the three `data-testid` hooks (§4) — small PR, no behavior change.
2. Write `access.spec.ts` (Group A, ~5 tests).
3. Defer everything in §6 to a follow-up plan once the quiz flow has unit-level determinism.
