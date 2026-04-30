# Plan: E2E tests for the Age of Apes app

> Drafted 2026-04-30. Companion to `2026-04-30-ideas-e2e-testing.md`.

Age of Apes is a `template: "minimal"`, `tier: "free"`, auth-required app. It is a **pure client-side calculator hub** — seven calculators rendered from static JSON in `apps/web/app/apps/age-of-apes/data/`. No DB tables, no server actions, no migrations. That means the Ideas plan's whole "test data strategy" section collapses to nothing here, and there is intentionally **no `tests/e2e/helpers/age-of-apes.ts`** — there is no entity to seed or assert against. State is `useState` in `components/calculator-app.tsx` and disappears on reload.

The only persistent thing the e2e layer touches is `app_permissions` (via the existing `seedPermission` helper), since `layout.tsx` calls `requireAppLayoutAccess("age-of-apes")` and the app is not in `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts`.

Existing component tests in `apps/web/app/apps/age-of-apes/__tests__/` (Vitest + jsdom) already cover render and the Time calc compute path. **E2E does not duplicate them** — it covers gating, routing, and the click-through-to-result UX in a real browser.

---

## 1. Setup

- **Env vars** (already used by the Ideas plan; reuse):
  - `E2E_TEST_USER_EMAIL/PASSWORD/ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Fixtures**: reuse `loggedInPage` and `unauthPage` from `tests/e2e/fixtures/auth.fixture.ts`. No new fixture needed.
- **Permissions**: `beforeAll` → `seedPermission(userId, "age-of-apes", "view")`. App registry sets `permission: "view"` (not `"edit"`), so seeding `"view"` matches what `requireAppLayoutAccess` checks. Tear down in `afterAll` to keep test users clean across runs.
- **No DB helper file** — the app has zero persistence. Adding an empty `helpers/age-of-apes.ts` would just be dead code. Note this absence explicitly in the spec header so future maintainers don't go looking.

## 2. Test inventory — Group A only

A single spec file covers everything that matters. The Ideas plan justifies seven groups because Ideas has CRUD, status, snooze, filters, AI plan, and a known modal-centering regression. Age of Apes has none of those — it is a stateless form → click → render-results loop, repeated seven times. Spreading that over multiple groups would pad. So: **Group A — Access, routing, smoke**.

### Group A — Access, routing, calculator smoke

1. **Unauth → login redirect.** `unauthPage.goto("/apps/age-of-apes")` redirects through `/auth/login`. Mirrors `auth.spec.ts` pattern; cheap regression on the `auth: true` flag in the registry.
2. **Auth without permission → unauthorized.** Logged-in user with no `app_permissions` row reaches the unauthorized page. Confirms the layout gate is wired and that the app is not accidentally added to `APP_SELF_ENROLL_SLUGS`.
3. **Auth with `view` permission → hub renders.** `seedPermission(... "view")`, navigate to `/apps/age-of-apes`, assert the "🦍 Age of Apes Guide" hero and the seven calculator cards are visible (one card per `CALCULATORS` entry in `lib/calculators.ts`).
4. **Hub → calculator nav.** Click the "🏗️ Buildings" badge in the hero strip; URL becomes `/apps/age-of-apes/buildings`; breadcrumb shows "🦍 Age of Apes / 🏗️ Buildings"; the `BuildingsCalc` form is visible. Guards `generateStaticParams` + dynamic `[calculator]` routing.
5. **Invalid calculator slug → 404.** `goto("/apps/age-of-apes/not-a-calc")` hits `notFound()` from `[calculator]/page.tsx`. Tiny test, catches a future regression where `isValidCalculatorSlug` is loosened.
6. **Time calculator: click Calculate → ResultGrid renders.** The Time calc needs no JSON data so it is the most stable smoke target (and matches the existing Vitest test). Defaults already populate the inputs; click "Calculate"; assert the four result tiles ("Original Time", "Actual Time", "Time Saved", "Speed Bonus") appear. Verifies the client component hydrates and the `useState` → `setResults` cycle works in a real browser, which jsdom cannot prove.
7. **Buildings calculator: speed buff visibly reduces actual time.** Pick the first building, set Start=1, End=10, Speed=0, click Calculate, capture "Actual Time" text. Tick "Architect (+3%)" and "Rise & Soar (+10%)", click Calculate again. Assert the new "Actual Time" string is different from the first. This is the only test that exercises the buff math end-to-end through the UI — Vitest covers `calcBuildings` directly but not the checkbox → state → recompute path.
8. **Cross-calculator nav from `[calculator]` page.** From `/apps/age-of-apes/buildings`, the "Other Calculators" footer shows the six non-current calculators. Click "🔬 Research"; URL becomes `/apps/age-of-apes/research`; the Research form (Category/Research Item selects) renders. Catches breakage in the filter at `[calculator]/page.tsx:93`.

That is the whole catalog. Eight tests. Anything more would be retesting `lib/calculators.ts` math through the UI, which the existing Vitest suite already does faster.

## 3. Spec organization

```
apps/web/tests/e2e/age-of-apes/
  access.spec.ts   # Group A — all 8 tests
```

One file. The crud-spec template at `.claude/skills/lr-app-e2e-bootstrap/references/spec-templates/crud.spec.ts` is **not used** — there is no entity to create, edit, or delete. The spec follows the access-pattern half of that template (env-var skip guard, `seedPermission` in `beforeAll`, no `afterEach` cleanup needed because nothing was written).

## 4. Selector strategy

The hub and `[calculator]` pages currently lean on emoji + text. Two small, surgical `data-testid` additions keep tests stable as copy is tweaked:

- `lib/calculators.ts` consumers (`page.tsx`, `[calculator]/page.tsx`, `components/calculator-card.tsx`): `calculator-card-${slug}` on each card and `calculator-pill-${slug}` on each badge link in both the hero strip and the breadcrumb-footer.
- `components/calculator-app.tsx`: `calc-form-${slug}` on each calculator's root container, `calc-submit` on the shared `CalcButton`, `calc-result-${index}` on each `ResultGrid` card. The button id is shared because every calculator uses the same `CalcButton` — using a single testid avoids one-per-calc churn.

That is it. No testids on inputs — labels (`Days`, `Speed %`) are stable game-domain copy, not marketing copy, and `getByLabel` is fine.

## 5. Running

- `pnpm --filter web test:e2e` — same script the Ideas plan adds. If `age-of-apes` is run alongside Ideas, no config change.
- For CI, add `age-of-apes` to `APP_SELF_ENROLL_SLUGS` **only if** we drop the `seedPermission` step. We don't — DB seed is more deterministic than self-enroll redirect timing, and it matches the Ideas plan.

## 6. Out of scope

- Math correctness for any calculator — covered by `__tests__/calculator-app.test.tsx` and the dedicated calculator unit tests live (or belong) next to `lib/calculators.ts`.
- Visual regression on the gradient calculator cards.
- Mobile nav (the `<nav className="hidden md:flex …">` link strip in `layout.tsx`) — Playwright project is desktop Chrome only.

---

## Execution order

1. Add the small `data-testid` set in §4 — no behavior change, lands first.
2. Write `apps/web/tests/e2e/age-of-apes/access.spec.ts` with all 8 tests.
3. Run locally with `E2E_TEST_USER_*` set; confirm permission cleanup in `afterAll` actually deletes the row (use `getPermission` from `helpers/db.ts`).
