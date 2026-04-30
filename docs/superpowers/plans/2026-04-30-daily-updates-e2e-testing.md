# Plan: E2E tests for the Daily Updates app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Daily Updates is a **read-only social feed**: a list of "updates" posted by other apps with reactions, source/category/time filters, search, and a "Load more" pager. There are no UI affordances to create/edit/delete updates from this app. Reactions today are client-only state (no server persistence) — the optimistic increment lives entirely in `FeedApp`'s `useState`. So this plan is intentionally narrower than the Ideas plan: the test surface is access gating + read/render + filtering, not CRUD.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used by `helpers/db.ts`
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. No second user needed — there are no entitlement-gated features (`features: {}` in the registry, `tier: "free"`).
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "daily-updates", "view")` — the registry entry requires `permission: "view"`, not `edit`. Tear down after.
- **Self-enroll note**: `playwright.config.ts` `webServer.env.APP_SELF_ENROLL_SLUGS` currently lists only `command-center,standup`. We do **not** need to add `daily-updates` — `seedPermission` is the canonical path for E2E and avoids coupling to the self-enroll allowlist.

## 2. Test data strategy (the work that doesn't exist yet)

✓ Migrations + API route landed in [#410](https://github.com/last-rev-llc/lr-apps/pull/410):
- `supabase/migrations/20260430_daily_updates.sql` provisions `daily_updates` + `daily_update_profiles`.
- `apps/web/app/api/daily-updates/route.ts` provides the `GET` handler (Zod-validated `offset`/`limit`, gated by `requireAccess("daily-updates", "view")`) that powers the "Load more" button.

Add `tests/e2e/helpers/daily-updates.ts` with service-role helpers:

- `seedUpdate(partial?: Partial<DailyUpdateRow>): Promise<DailyUpdate>` — direct insert, returns row. No `userId` argument — updates are not user-owned (the `daily_updates` table is global; rows describe other apps' activity, not the viewer's data).
- `seedUpdates(count, factoryFn?)` — bulk
- `listUpdates()`, `getUpdate(id)` — read assertions
- `deleteSeededUpdates(idPrefix = "e2e-")` — cleanup. We tag every seeded row's id with an `e2e-` prefix (or seed into a known title prefix) so we only delete rows we created — do **not** truncate the table; other tests/dev data may share it.
- `seedProfile(partial)` / `deleteSeededProfiles(idPrefix)` — same pattern for `daily_update_profiles`.

Why DB-direct seeding (not UI): there is no UI to create updates. DB seeding is the only path to a deterministic feed state.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/daily-updates` redirects to login (proxy + `requireAppLayoutAccess` enforce this; mirrors Ideas test 1)
2. Auth user without `daily-updates` permission → unauthorized page
3. Auth user with `daily-updates:view` permission → page renders, header shows "📱 Daily Updates" (from `layout.tsx`) and the page heading "📱 Daily Updates" with subtitle "Where apps come to brag about wins."
4. About route is gated the same way: `/apps/daily-updates/about` requires the same permission (it shares `layout.tsx`); confirm it renders for permitted users and redirects otherwise.

> No entitlement test — `features: {}` and `tier: "free"` mean every authenticated user with `view` permission gets the full app. If billing-gated reactions or AI summaries are added later, add a Group A entitlement test then. Don't pre-write tests for features that don't exist.

### Group B — Read & render

5. Empty feed (no rows) → `EmptyState` renders with title containing "No updates yet"
6. Single seeded update → card renders title, body, source name, source icon, formatted relative time
7. High-priority update → "🔥 High" badge visible
8. Update with `category` set → category badge visible, category name capitalized + dashes spaced (helper `formatCategoryName`: `bug-fix` → `Bug fix`)
9. Update with `links` array → external link buttons render with `target="_blank"` and `rel="noopener noreferrer"` (security invariant — guard against regression)
10. Update with `links` as a JSON string (legacy column shape) → still parsed and rendered (`parseLinks` handles both)
11. Update with malformed `links` JSON → renders the card without crashing (defensive `try/catch` path)
12. Initial limit honored: seed 25 rows → first paint shows 20 (matches `getInitialUpdates(20)`); "Load more" button visible.

> No CRUD group. There is no create/edit/delete UI for updates in this app. Inventing tests for affordances that don't exist would just rot.

### Group C — Filtering & search (client-side)

The filter logic in `FeedApp` is pure-client over `initialUpdates` — no server roundtrip. Tests assert visible cards before/after each filter change.

13. Search by title substring → only matching cards render
14. Search by body substring → only matching cards render
15. Search by source name → only matching cards render (e.g. "Command" matches "Command Center")
16. Search with no matches → `EmptyState` renders
17. Source-app `<select>` change to a specific app → only that app's rows render; "All Apps" option restores
18. Category `<select>` change → only that category's rows render; "All Categories" restores
19. Combined filters (search + category) → intersection only

### Group D — Time-range tabs

The `getTimeCutoff` helper is calendar-boundary based (start of today, start of ISO week with Monday as week start, start of month). Seed rows with explicit `created_at` to cover boundaries.

20. "All Time" (default) → all rows
21. "Today" tab → only rows with `created_at >= start-of-local-day`. Seed: one row at `now`, one at `now − 25h`. Expect only the recent one.
22. "This Week" → only rows since Monday 00:00 local. Seed boundary cases: today, 6d ago, 8d ago.
23. "This Month" → only rows since 1st of month 00:00 local.

> Time-cutoff math runs in the browser's local TZ. The CI runner's TZ is whatever Playwright inherits — flake risk if specs run near midnight UTC vs local. Mitigation: seed `created_at` values relative to `Date.now()` at test time (same clock the page reads), not hardcoded ISO dates. Avoid asserting around midnight boundaries.

### Group E — Reactions (UI-only state)

Reactions today have **no server persistence** — `handleReact` only updates `useState`. Tests assert UI, not DB.

24. Click 🔥 on a card → count "1" appears next to the emoji on that card
25. Click 🔥 twice → count "2"; clicking ❤️ on the same card adds an independent count
26. Reactions on card A do not affect card B
27. Reaction state is lost on page reload (regression guard: documents the current contract; if/when persistence ships, this test must be **inverted**, not deleted — that signals a real product change)

### Group F — Load more / pagination

`loadMore` calls `GET /api/daily-updates?offset=N&limit=20`. The route is implemented at `apps/web/app/api/daily-updates/route.ts` (landed in #410); it validates `offset`/`limit` with Zod, gates on `requireAccess("daily-updates", "view")`, and returns `DailyUpdate[]` directly.

28. Click "Load more" with 25 seeded rows → next 5 cards append; button hides because `newUpdates.length < 20`
29. Click "Load more" with 40 seeded rows → cards append; button stays visible because the last batch returned 20
30. Mock `/api/daily-updates` → 500 → `loadMore` swallows the error silently per current code; button re-enables, no cards append, no toast/alert. Documents current swallow-on-failure behavior so the regression is visible if a future change adds error UI without updating the test.
31. Unauth fetch direct against `/api/daily-updates` → redirects to login (the route's `requireAccess` covers it the same way the layout does).

### Group G — Navigation

31. Click "Feed" nav link from About → lands on `/apps/daily-updates`, feed renders
32. Click "About" nav link from Feed → lands on `/apps/daily-updates/about`, about content renders ("Where Apps Come to Brag About Wins.")

### Group H — A11y / regression

33. Keyboard: search input is focusable via Tab; `Enter` does not submit a form (input is not inside a `<form>`)
34. External link cards have `rel="noopener noreferrer"` (re-asserted from B9 as an explicit a11y/security guard so it survives refactors that touch the link rendering path)
35. Time-range `<TabsTrigger>` exposes `role="tab"` and `aria-selected` correctly (confirms the shadcn `Tabs` wiring isn't lost on refactor — already covered by the existing component test, but worth one E2E smoke since the real `Tabs` from `@repo/ui` is rendered, not the unit-test mock)

## 4. Spec organization

```
apps/web/tests/e2e/daily-updates/
  access.spec.ts        # A
  render.spec.ts        # B
  filters-search.spec.ts # C
  time-range.spec.ts    # D
  reactions.spec.ts     # E
  load-more.spec.ts     # F (skipped or mocked until /api/daily-updates exists)
  navigation.spec.ts    # G
  a11y.spec.ts          # H
```

Each file: `beforeAll` seeds permission + fixture data; `afterEach` deletes only the rows it inserted (matched by id prefix); uses the shared `loggedInPage` fixture.

## 5. Selector strategy (do this before writing specs)

Today the components rely on text + emoji + native `<select>`s. To keep tests stable as copy/styles change, add `data-testid` hooks to the high-traffic interactions in `feed-app.tsx`:

- `feed-update-card`, `feed-update-card-title`, `feed-update-card-source`, `feed-update-card-time`
- `feed-search-input`
- `feed-source-select`, `feed-category-select`
- `feed-tab-${all|day|week|month}` (or rely on `role="tab"` + accessible name — already works via `getByRole`)
- `feed-reaction-${emoji}` (one per card; emoji-suffixed to disambiguate within a card)
- `feed-reaction-count-${emoji}` (the small count badge)
- `feed-load-more-button`
- `feed-empty-state` (already implicitly covered — the `EmptyState` mock used `data-testid="empty-state"`; the real `@repo/ui` `EmptyState` may not. Add it on the real component or wrap the call site with a `data-testid`.)
- Layout: `daily-updates-nav-feed`, `daily-updates-nav-about`

Surgical, avoids querying by emoji-only text (🔥 collides with the High-priority badge).

## 6. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` — `daily-updates` is permission-gated, **not** self-enroll, so we rely on `seedPermission` (no edit to `APP_SELF_ENROLL_SLUGS` needed)

## 7. Out of scope

- Server-persistence of reactions. If/when reactions ship to the DB (with a `POST /api/daily-updates/[id]/reactions` or similar), Group E expands and Group E27 inverts. Do not pre-write that.
- Component-unit-test duplication: `__tests__/feed-app.test.tsx` already covers rendering, search, category filter, today-tab, and reaction increment in jsdom. E2E re-covers them at the integration layer because the unit test mocks `@repo/ui` — the real shadcn components and the real Supabase round-trip are only exercised end-to-end.
- Visual regression (screenshot diff) — separate effort.

---

## Execution order

1. Add `data-testid` hooks (§5) — small, no behavior change.
2. Add `tests/e2e/helpers/daily-updates.ts` — DB seed/cleanup with id-prefix safety against `supabase/migrations/20260430_daily_updates.sql`.
3. Write `access.spec.ts` + `render.spec.ts` first (highest value, lowest flake risk).
4. Layer in C/D/G/H.
5. `reactions.spec.ts` — small surface; the contract is "client-only" today and that's the test we're encoding.
6. `load-more.spec.ts` against the live `/api/daily-updates` route.
