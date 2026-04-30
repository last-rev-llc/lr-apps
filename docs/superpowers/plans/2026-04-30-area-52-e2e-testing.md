# Plan: E2E tests for the Area 52 app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Area 52 is a read-only R&D experiments tracker (`template: "minimal"`, `tier: "free"`, `auth: true`). The page renders rows from `area_52_experiments`, then offers client-side search + a 5-way status filter. There is no create/edit/delete UI, no per-user ownership, and no entitlement gating — so the test surface is intentionally narrow. We reuse the existing Playwright infra (`apps/web/playwright.config.ts`, `tests/e2e/fixtures/auth.fixture.ts`, `tests/e2e/helpers/db.ts`) and only add what's strictly needed.

---

## 1. Setup

- **Env vars** (already wired for other suites):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Fixtures**: reuse `loggedInPage` and `unauthPage` from `auth.fixture.ts`. No new fixtures.
- **Permissions**: `beforeAll` calls `seedPermission(userId, "area-52", "view")` — registry entry is `permission: "view"`, not `"edit"`. `afterAll` removes it so the suite leaves no residue.

## 2. Test data strategy

Add `apps/web/tests/e2e/helpers/area-52.ts` with service-role functions:

- `seedExperiment(partial?)` / `seedExperiments(rows[])` — insert with a unique title prefix `e2e-area52-${Date.now()}-…`
- `deleteE2EExperiments()` — `DELETE … WHERE title LIKE 'e2e-area52-%'`; runs in `afterAll`

Why prefix-scoped cleanup (vs. per-user like Ideas): the table has no `user_id` column — rows are global to all authenticated users, so a blanket delete would clobber dev/CI seed data. The prefix gives a safe, idempotent scope and lets concurrent suites coexist. No CRUD/server-action helpers because the app has no mutation paths; this helper is the extension point if writes land later.

## 3. Use-case catalog (Group A only)

### Group A — Access, render, filter (smoke + the entire app)

1. Unauth user → `/apps/area-52` redirects to login
2. Auth user without `area-52` permission → unauthorized page
3. Auth user with `area-52:view` → page renders with header `👽 Area 52`
4. Empty DB (no `e2e-area52-` rows + clean fixture state) → `EmptyState` "No experiments found" renders
5. Seeded experiments render as cards with title, status badge, and (when present) description / category / owner / outcome
6. Search input filters by title substring (debounced ~400ms — match the unit test's timing)
7. Search matches `description`, `owner`, and `outcome` fields too (the `Area52App` filter checks all four)
8. Status filter chip "Active" → only `status: "active"` cards visible; "All" restores full list
9. Search + status filter combine (AND): "Active" + query that only matches a `shelved` row → empty state
10. Status badge text matches row status (`active` / `exploring` / `shelved` / `shipped`) — guards the `STATUS_BADGE_STYLE` map

No Group B–H. Stating this explicitly: no create/edit/delete UI, no row menu, no rating/snooze/views, no AI plan, no entitlement upgrade. Padding tests for absent features is dead weight; new groups land when new features do.

## 4. Spec organization

```
apps/web/tests/e2e/area-52/
  access.spec.ts   # A1–A3 (unauth, unauthorized, authorized render)
  render.spec.ts   # A4–A5, A10 (empty state, card fields, badge text)
  filters.spec.ts  # A6–A9 (search, status, combined)
```

Three small specs > one omnibus file: failures localize, and `access.spec.ts` runs without seeded data, so it's the cheapest signal if auth regresses.

Each file: `beforeAll` seeds permission, `afterAll` deletes prefix-scoped rows + permission. Uses the shared `loggedInPage` fixture; A1 uses `unauthPage`.

## 5. Selector strategy

Add `data-testid` hooks to `area-52-app.tsx` so specs don't break on copy/emoji tweaks:

- `area-52-search`, `area-52-empty-state`
- `area-52-status-filter-${value}` for each of `all|exploring|active|shelved|shipped` (raw value, not label, so it survives copy edits)
- `experiment-card`, `experiment-card-title`, `experiment-card-status`

## 6. Running & out of scope

- `pnpm --filter web test:e2e -- area-52` runs this suite. `area-52` is **not** in `APP_SELF_ENROLL_SLUGS` (only `command-center,standup`) — so `seedPermission` is mandatory; don't add it to the env list or A2 stops catching real regressions
- Out of scope: render/search/status-filter logic is already covered by `apps/web/app/apps/area-52/__tests__/page.test.tsx` at the component level — E2E only verifies the auth → SSR → render → client-filter loop. Visual regression and write paths (don't exist) are also out

---

## Execution order

1. Add `data-testid` hooks (§5) — no behavior change, ships independently
2. Add `tests/e2e/helpers/area-52.ts` — seed/cleanup with prefix-scoped delete
3. `access.spec.ts` first (cheapest signal, no seed dependency)
4. `render.spec.ts` then `filters.spec.ts`
