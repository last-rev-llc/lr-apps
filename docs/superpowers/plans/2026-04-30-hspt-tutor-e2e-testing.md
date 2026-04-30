# Plan: E2E tests for the HSPT Tutor app

> Seed for `alpha-plan`. Drafted 2026-04-30.

The HSPT Tutor is a **`template: "minimal"`** app: a single client component (`tutor-app.tsx`) with three tabs (Dashboard / Quiz / Progress) backed by **localStorage** under the key `hspt_tutor_quizzes`. There are no server actions, no Supabase tables, and no `__tests__/actions.test.ts`. That shapes the plan: we lean on the existing Playwright + Auth0 fixture (`tests/e2e/fixtures/auth.fixture.ts`) and the `seedPermission` helper (`tests/e2e/helpers/db.ts`), and we **do not** add a `tests/e2e/helpers/hspt-tutor.ts` — there is no DB to seed or assert against.

Registry row (verified in `apps/web/lib/app-registry.ts:83`):
`{ slug: "hspt-tutor", routeGroup: "apps/hspt-tutor", auth: true, permission: "view", template: "minimal", tier: "free" }`.

---

## 1. Setup (one-time, prereq)

- **Env vars** — same as `auth.spec.ts`:
  - `E2E_TEST_USER_EMAIL` / `_PASSWORD` / `_ID` (Auth0 sub)
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **No second user / no entitlement gating** — `tier: "free"`, no paywall, no `ai-plan`-style upsell.
- **Permissions** — `beforeAll` calls `seedPermission(userId, "hspt-tutor", "view")` (registry minimum is `view`, not `edit` like Ideas). `afterAll` calls `deletePermission` so the test does not leak access.
- **Self-enroll** — currently `playwright.config.ts` only seeds `APP_SELF_ENROLL_SLUGS=command-center,standup`. We do **not** add `hspt-tutor` here; gating tests rely on `seedPermission` and `deletePermission` directly so they work under both `next dev` and `next start`.

## 2. Test data strategy

**No DB-side helpers.** Persistence is `localStorage` only, so there is nothing for a service-role client to insert. Two tactics replace the usual `seedX`/`listXForUser` shape:

- **Pre-seed via `addInitScript`** — for tests that need a "user with prior quizzes" starting state, push a `QuizRecord[]` into `localStorage` before the page loads. Lives inline in each spec or in a tiny `tests/e2e/helpers/hspt-tutor-storage.ts` if it gets reused (decide once we write the second spec, not now — YAGNI).
- **Read-back via `page.evaluate`** — to assert "the quiz was saved", read `localStorage.getItem("hspt_tutor_quizzes")` and `JSON.parse` inside the page. This replaces the `listIdeasForUser(userId)` DB read.
- **Cleanup** — `afterEach` clears the storage key so tests stay independent. There is no cross-user contamination because storage is per-browser-context.

The `QuizRecord` shape is fixed in `lib/types.ts` (`id`, `date`, `score`, `total`, `topics`, `answers`); seed records use those fields verbatim so `computeTopicStats` produces realistic dashboard output.

## 3. Use-case catalog

Only **Group A** (access & gating) is in this plan. CRUD/filter/AI groups don't apply — see §6.

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/hspt-tutor` redirects to `/login`
2. Auth user without `hspt-tutor` permission → `/unauthorized?app=hspt-tutor` (mirrors auth.spec.ts test 2)
3. Auth user with `view` permission → page renders header `🎯 HSPT Tutor` and tab list (Dashboard / Practice / Progress)
4. Permission hierarchy — `admin` (or `edit`) also satisfies the `view` minimum (smoke check that registry-declared `permission: "view"` is honored, not hard-coded to "view" only)

That's it. Four tests, one spec file. The "minimal" template means no behavior tests in the e2e tier — those live in the existing component test (`components/__tests__/tutor-app.test.tsx`) and adaptive-algorithm test (`lib/__tests__/adaptive.test.ts`), both of which already cover the localStorage round-trip, adaptive quiz selection, and tab rendering at the unit level.

## 4. Spec organization

```
apps/web/tests/e2e/hspt-tutor/
  access.spec.ts           # Group A — only spec in this plan
```

Single file. Mirrors the structure of `auth.spec.ts` (which is the closest existing precedent for an access-only suite). `beforeAll` seeds permission, `afterAll` deletes it, individual tests use the `loggedInPage` and `unauthPage` fixtures.

## 5. Selector strategy

The header `<h1>` already reads `🎯 HSPT Tutor` and the tabs render literal labels (`📊 Dashboard`, `⚡ Practice`, `📈 Progress`). For four access-tier tests we can rely on those text matches plus role queries — adding `data-testid` hooks now is overkill for the scope and would touch `layout.tsx` + `tutor-app.tsx` for no measurable robustness gain. **If/when Group B-style tests are added later** (e.g., "completing a quiz writes to localStorage"), we add `data-testid` on the Practice button, choice buttons, and Next button at that point, not now.

## 6. Out of scope (and why)

- **CRUD specs** — there is no entity to create/edit/delete; quiz records are produced as a side-effect of completing a quiz, not via a form.
- **Filtering / sorting / search** — no list UI with filters; the Dashboard sorts topics internally and the Progress tab sorts by pct asc, both deterministic from data and already covered by the component test.
- **Quiz-completion flow E2E** — the adaptive selection (`buildAdaptiveQuiz`) and localStorage round-trip are covered by `lib/__tests__/adaptive.test.ts` and `components/__tests__/tutor-app.test.tsx`. Re-running that flow through Playwright would be slow (10 sequential clicks per quiz) and would duplicate unit coverage. Revisit only if we see real production bugs in the click-through.
- **AI / billing gating** — none exists; `tier: "free"` with no entitlement keys.
- **Visual regression** — separate effort, same as Ideas plan.

## 7. Running

- `pnpm --filter web test:e2e` (existing script) → Playwright picks up the new `hspt-tutor/` folder automatically (`testDir: "./tests/e2e"`).
- Local dev server reused (`reuseExistingServer: !CI`).
- CI: works under `next start` because Group A tests use `seedPermission` directly rather than relying on `APP_SELF_ENROLL_SLUGS`.

---

## Execution order

1. Add `apps/web/tests/e2e/hspt-tutor/access.spec.ts` (Group A — 4 tests)
2. Verify locally with `E2E_TEST_USER_*` set; confirm `seedPermission`/`deletePermission` round-trip on the `hspt-tutor` slug
3. Land. Stop. No follow-up groups planned unless production telemetry surfaces something.
