# Plan: E2E tests for the Proper Wine Pour app

> Seed for `alpha-plan`. Drafted 2026-04-30.

`template: "minimal"` and `tier: "free"`. Auth-gated (`auth: true`, `permission: "view"`). The app is a five-tab client component (`components/wine-app.tsx`): Pour Guide, Calculator, Tracker, Knowledge, Community Wall. Existing infra is reused — Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) and `seedPermission` (`tests/e2e/helpers/db.ts`).

---

## 1. Setup (one-time, prereq)

- **Env vars** (already used by infra):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **No new fixtures**: reuse `loggedInPage`.
- **Permissions**: `beforeAll` → `seedPermission(userId, "proper-wine-pour", "view")`; `afterAll` → `deletePermission(...)`. `view` is the registry minimum.
- **Self-enroll note**: `proper-wine-pour` is NOT in `APP_SELF_ENROLL_SLUGS` (`playwright.config.ts` only seeds `command-center,standup`), so the test relies on `seedPermission`, not the self-enroll path.

## 2. Test data strategy

No dedicated `helpers/proper-wine-pour.ts` is needed for Group A. Why:

- The Tracker tab reads `restaurants` from the static JSON (`data/restaurants.json`) bundled with the app — no DB seed required to render rows.
- The Tracker/Wall write paths target Supabase tables `wine_pours` and `pour_wall`, but **no migration exists** under `supabase/migrations/` for these tables (verified 2026-04-30). `getWinePours`/`getWallPosts` swallow the error and return `[]`, so the page still renders. Group A asserts the page renders with empty state — it intentionally does NOT exercise create/upvote against a missing table.
- A follow-up plan should land the migration + a `helpers/proper-wine-pour.ts` (`seedPour`, `seedWallPost`, `delete*ForUser`) before any Group B/C work.

## 3. Use-case catalog (test inventory)

### Group A — Access & smoke (the only group for now)

1. **Unauth → login**: `unauthPage` GETs `/apps/proper-wine-pour` → redirected to `/login` (or `/auth/login`). Guards the layout's `requireAppLayoutAccess("proper-wine-pour")`.
2. **Auth, no permission → /unauthorized**: `deletePermission` first, then visit; expect `?app=proper-wine-pour` query param. Mirrors `auth.spec.ts` test 2.
3. **Auth + `view` permission → page renders**: header shows `🍷 Proper Wine Pour`; the five tab triggers (`Pour Guide`, `Calculator`, `Tracker`, `Knowledge`, `Community`) are visible. This is the load-bearing smoke check — confirms registry routing, layout, JSON data import, and client component all hydrate.
4. **About sub-route renders under the same gate**: visit `/apps/proper-wine-pour/about`; assert "Every Glass Deserves a Proper Pour." h1. Same `requireAppLayoutAccess` covers nested routes — guards against accidental layout removal.
5. **Calculator tab is interactive (no DB)**: click the `Calculator` tab, assert the default "5.1 glasses per bottle" math is visible (matches the existing unit test in `__tests__/wine-app.test.tsx`). Calculator is pure client state, so this is the safest write-side smoke until the DB tables exist.
6. **Tracker renders restaurant rows from static JSON**: click `Tracker`, assert at least one restaurant name from `data/restaurants.json` is visible, and the empty-state DB count "0 Pours Logged" renders (confirms `getWinePours` failed-soft path returned `[]`).

## 4. Spec organization

```
apps/web/tests/e2e/proper-wine-pour/
  access.spec.ts           # Group A (1-6)
```

`beforeAll` seeds permission; `afterAll` deletes it. No `afterEach` cleanup needed — Group A makes no DB writes.

## 5. Selector strategy

Today the layout uses text + emoji (`🍷 Proper Wine Pour`) and `<TabsTrigger value="...">` from `@repo/ui`. For Group A we can lean on:

- `getByRole("heading", { name: /proper wine pour/i })` for the layout header
- `getByRole("tab", { name: /pour guide|calculator|tracker|knowledge|community/i })` — already used by the unit tests in `__tests__/wine-app.test.tsx`, so the selectors are stable
- `getByText("Pour Calculator")`, `getByText("5.1")` for tab content

No `data-testid` hooks are required for Group A. Add them later (Group B+) when the form/list rows need stable handles for create-edit-delete flows.

## 6. Running

- `pnpm --filter web exec playwright test tests/e2e/proper-wine-pour/`
- Local dev server reused (`reuseExistingServer: !CI`). Tests skip when `E2E_TEST_USER_*` env vars are missing — same pattern as `auth.spec.ts`.

## 7. Out of scope (for this plan)

- **Tracker create flow**, **Wall post create**, **upvote** — gated on the missing `wine_pours` / `pour_wall` migrations. File a follow-up to add `supabase/migrations/<date>_wine_pours.sql` (+ `.down.sql`, append-only rule) before writing Group B.
- **Knowledge / Guide tab content drift** — the JSON-fed tabs are exercised at the unit-test layer (`__tests__/wine-app.test.tsx`); duplicating that in E2E adds no signal.
- **Calculator boundary math** (negative inputs, NaN) — covered by unit tests; E2E only smoke-checks the default render.
- **Visual regression / screenshot diff** — separate effort.

---

## Execution order

1. Write `access.spec.ts` (Group A 1-6) — single file, ~120 LOC, reuses existing helpers.
2. Land the `wine_pours` + `pour_wall` migrations in a separate PR.
3. After migrations land: add `helpers/proper-wine-pour.ts` and Group B (CRUD on Tracker + Wall).
