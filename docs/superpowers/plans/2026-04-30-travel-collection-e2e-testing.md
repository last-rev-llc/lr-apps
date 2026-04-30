# Plan: E2E tests for the Travel Collection app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Travel Collection is a **public, read-only** catalog (`auth: false` in `apps/web/lib/app-registry.ts`). The page is a server component that loads `travel_properties` and hands them to a client component that filters/sorts in memory and opens a detail modal. No CRUD, no server actions — so the plan is short, uses no `loggedInPage`, and has no write paths.

---

## 1. Setup (one-time, prereq)

- **Auth fixture: do NOT use `loggedInPage`.** This app is public — using the auth fixture would mask a regression where someone accidentally adds `requireAppLayoutAccess` to the route. Tests use the plain Playwright `page` fixture (or `unauthPage` from `auth.fixture.ts` to be explicit about no cookies).
- **Env**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (already used by `tests/e2e/helpers/db.ts`). No `E2E_TEST_USER_*` needed.
- **Migration prerequisite.** As of 2026-04-30 there is no `travel_properties` migration in `supabase/migrations/`. Seed helpers will fail until that lands — call this out in the helper with a `// TODO: depends on travel_properties migration` comment.

## 2. Test data strategy

Add `apps/web/tests/e2e/helpers/travel-collection.ts` with service-role helpers:

- `seedProperty(partial?)` — inserts one row with a unique `name` (`e2e-${Date.now()}-${random}`) so parallel files don't collide.
- `seedProperties(rows[])` — bulk insert for filter/sort fixtures.
- `deleteE2EProperties()` — `delete().like("name", "e2e-%")`; called in `afterAll`.

DB-direct because the app has no create UI; rows must exist before the page renders them.

## 3. Use-case catalog

### Group A — Renders for any visitor (smoke)

1. Unauth visitor → `/apps/travel-collection` returns 200, **no redirect to `/auth/login` or `auth0.com`** (this is the auth=false invariant).
2. Header `🏨 Travel Collection` link + `← Dashboard` link visible — confirms `layout.tsx` rendered, not a 404/unauthorized shell.
3. Hero h1 `🏨 Travel Collection` visible.

### Group B — Filtering & search

4. Search by name → only matching cards visible.
5. Search `zzznomatch` → empty state + "Clear filters" button.
6. Click "Clear filters" → all seeded cards return.
7. Category select → narrows; group heading count `(n)` matches.
8. Region select → narrows to chosen region.
9. Type select → narrows to chosen type.
10. Combined filters (category + region) → AND semantics; empty state when no row matches.

### Group C — Sort & grouping

11. Sort by Region → groups order alphabetically by region.
12. StatsBar counts (`properties / researched / pending / regions`) match the seeded fixture.

### Group D — Property modal

13. Click card → dialog opens; title matches property name.
14. Modal renders description, location, region, type badges.
15. Researched property shows `✓ Researched`; unresearched shows `Pending Research`.
16. Esc closes the modal.
17. Property with `photos: null` falls back to type-emoji placeholder — regression guard for the `firstPhoto` ternary in `PropertyCard`.

## 4. Spec organization

```
apps/web/tests/e2e/travel-collection/
  access.spec.ts     # A
  filters.spec.ts    # B + C
  modal.spec.ts      # D
```

Each file: `beforeAll` seeds via `seedProperties`; `afterAll` calls `deleteE2EProperties()`. Every test signature is `async ({ page }) => …` — never `loggedInPage`.

## 5. Selector strategy

Components lean on text + `aria-label` on the `<select>`s. Add minimum `data-testid` hooks so specs survive copy/emoji churn:

- `property-card`, `property-modal`, `property-modal-title`
- `filter-search`, `filter-category`, `filter-region`, `filter-type`, `filter-sort`
- `clear-filters`, `stats-${properties|researched|pending|regions}`

## 6. Running

- `pnpm --filter web test:e2e` → `playwright test`. Dev server is reused (`reuseExistingServer: !CI`).
- No entry needed in `APP_SELF_ENROLL_SLUGS` — there is no permission gate.

## 7. Out of scope

- Component unit tests already exist in `apps/web/app/apps/travel-collection/__tests__/` (`page.test.tsx`, `travel-app.test.tsx`) — don't duplicate in-memory filter coverage.
- Subdomain routing (`subdomain: "travel"`) — covered by `tests/e2e/subdomain-routing.spec.ts`.
- Visual regression / image fixtures — separate effort.

---

## Execution order

1. Land the `travel_properties` migration (prereq — §1).
2. Add `data-testid` hooks (§5).
3. Add `tests/e2e/helpers/travel-collection.ts`.
4. Write `access.spec.ts` first (protects the public-route invariant), then `filters.spec.ts`, then `modal.spec.ts`.
