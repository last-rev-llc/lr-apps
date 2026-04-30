# Plan: E2E tests for the Standup app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Important shape note up front: Standup is **read-only**. The page (`apps/web/app/apps/standup/page.tsx`) reads from the `days` table via `getStandupDays()`; there is no create/edit/delete UI, no server actions, no `__tests__/actions.test.ts`. The `days` rows are **not** scoped per-user (no `user_id` column on the row shape) — so seed data is global to the test run, not user-owned. The only interactive element is the source-filter pill row in `standup-app.tsx`. The plan reflects that — no CRUD/AI/snooze sections. Tier is `free`, auth is required, slug is already listed in `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts`.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used; required to seed/cleanup `days`
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. No second user needed — Standup has no entitlement-gated features.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "standup", "view")` so the test user can reach `/apps/standup`. Tear down after. ("view" is the registry's `permission` field for this slug — do **not** seed "edit" because the layout's `requireAppLayoutAccess("standup")` only enforces the registry minimum and seeding higher than necessary hides regressions where the minimum drifts.)
- **Self-enroll**: already wired — `playwright.config.ts` sets `APP_SELF_ENROLL_SLUGS=command-center,standup`, so explicit `seedPermission` is still preferred for determinism (don't rely on self-enroll side-effects across specs).

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/standup.ts` with service-role helpers:

- `seedDay(partial?: Partial<DayRow>): Promise<StandupDay>` — inserts directly into `days`, returns row. Caller passes `date`, `dayOfWeek`, and an `activities` JSON array.
- `seedDays(rows: Array<Partial<DayRow>>)` — bulk insert; useful for multi-day rendering/order tests.
- `getDay(id)`, `listDaysSeededByTest(prefix)` — assertions read DB to confirm what the page rendered actually came from the seeded rows (and not stale fixtures).
- `deleteDaysByIdPrefix(prefix)` — cleanup; called in `afterEach`. Seed IDs with a deterministic test prefix (e.g. `e2e-standup-${Date.now()}-…`) because the table is global, not per-user — we can't rely on `user_id` to scope cleanup the way the Ideas plan does.

Why DB-direct seeding (not UI): there is no UI to create a day — rows arrive via an external aggregation pipeline (Slack/GitHub/Workspace/Jira). Direct insert is the **only** way to drive deterministic state.

Why a prefix-scoped cleanup (not a per-user cleanup): the `days` table has no `user_id`. Tests must not nuke the whole table — production-shape data may already exist in dev databases. Seed and delete by id prefix only.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/standup` redirects to login
2. Auth user without `standup` permission → `/unauthorized?app=standup`
3. Auth user with `standup:view` permission → page renders with header "📋 Daily Standup" (the `<h1>` inside `layout.tsx`) and the page-level subtitle "Aggregated updates from Slack, GitHub, and Workspace."
4. Permission hierarchy: user with `standup:admin` can also load the page (admin satisfies the `view` minimum — guards regressions in `requireAppLayoutAccess`)
5. Self-enroll path: user with no permission lands on `/unauthorized`, "Get access" button is visible (slug is in `APP_SELF_ENROLL_SLUGS`), clicking it grants `view` and redirects back to `/apps/standup`

### Group B — Render & data shape

6. Empty state: zero seeded days → `EmptyState` with copy "No standup entries yet." renders, day cards do not
7. Single seeded day → one `DayCard` renders, displays the formatted "{dayOfWeek}, {Month} {d}" header, and the activity-count line ("N updates", or "1 update" — singular/plural is computed in the component)
8. Multiple seeded days → cards render in **descending date order** (matches `queries.ts` `.order("date", { ascending: false })`)
9. Activities-as-JSON-string row: seed a row where `activities` is stored as a JSON string (the queries layer parses both shapes — confirm the page renders it identically)
10. Source badges: a day with all four sources (slack/github/workspace/jira) renders all four `SourceBadge` pills in the card header
11. Activity ordering inside a source group: seed activities out of time order; assert they render sorted ascending by `time` (the `SourceGroup` component sorts client-side)
12. Source group ordering across a day: assert groups render in the fixed order `slack → workspace → github → jira` (matches `SOURCE_ORDER` in `standup-app.tsx`)
13. Unknown/forward-compat source value: seed an activity with `source: "linear"` (not in `SOURCE_META`) — page must not crash; the unknown source falls into the default badge path with the 📌 icon (regression guard for the `?? { icon: "📌", … }` fallback)
14. `lastUpdated` header: when at least one seeded day has `updatedAt`, "Last updated:" is rendered with a non-empty timestamp; when all rows have null `updatedAt`, the line is absent

### Group C — Client-side filter

15. Filter pill row renders all five buttons in order: All Sources, 💬 Slack, 🔧 GitHub, 📝 Workspace, 📋 Jira
16. Default selected pill is "All Sources" (visual: outline variant + accent color) on first load
17. Click "💬 Slack" → only Slack activities remain; GitHub/Workspace/Jira activity descriptions are not in the DOM
18. Click "🔧 GitHub" → mirror assertion (GitHub-only)
19. Filtering hides whole day cards when no activities remain after filter (a day with zero Slack rows disappears when "Slack" is selected)
20. Click "All Sources" after filtering → previously-hidden activities return to the DOM (regression for the filter-restore path tested in the unit test)
21. Filter is **not** persisted across navigation — leave page, return, default is "All Sources" again (state lives in `useState`, not URL/localStorage; this assertion locks that contract so a future change to URL-state requires a deliberate plan update)

### Group D — Footer & static copy

22. Footer line "Sources: Slack, GitHub, Workspace. Jira integration pending re-auth." is rendered (regression guard so the "pending re-auth" disclaimer isn't accidentally removed before Jira is re-wired)
23. Header "← Dashboard" link in the layout points to `/` (matches the layout test; e2e confirms it's a real `<a href>` rendered server-side)

### Group E — A11y / regression

24. Keyboard: Tab order through the filter pill row reaches each button; Space/Enter activates a pill (the buttons are real `<button>` elements via `@repo/ui` Button — protect against a future swap to a non-button element)
25. The page heading is exactly one `<h1>` (the layout's "📋 Daily Standup") — guards against the `standup-app.tsx` `<h1>` being promoted out of an `<h2>` and creating two `<h1>`s on the page (it currently is an `<h1>` inside the body — see §6 Open question)

## 4. Spec organization

```
apps/web/tests/e2e/standup/
  access.spec.ts           # A
  render.spec.ts           # B
  filter.spec.ts           # C
  static-content.spec.ts   # D
  a11y.spec.ts             # E
```

Each file: `beforeAll` seeds permission + (where needed) `days` rows; `afterEach` deletes seeded `days` by id prefix; uses the shared `loggedInPage` fixture. `access.spec.ts` does not seed `days` — it only exercises the layout gate.

## 5. Selector strategy (do this before writing specs)

`standup-app.tsx` and `layout.tsx` currently expose only emoji + role/name selectors. To keep tests stable as copy/styles change, add `data-testid` hooks to the high-traffic elements:

- `standup-header` on the layout's `<header>`
- `standup-page-title` on the page-level `<h1>` (so the layout `<h1>` and the inner `<h1>` are individually addressable while §6 is open)
- `standup-last-updated` on the "Last updated" `<p>`
- `source-filter-${value}` for each filter button (`source-filter-all`, `source-filter-slack`, …)
- `day-card`, `day-card-header`, `day-card-activity-count`
- `source-group-${source}`, `source-badge-${source}`
- `activity-row` on each `<li>` inside `SourceGroup` (lets §B11 / §C tests target activities without depending on description text)
- `standup-empty-state` on the `EmptyState`
- `standup-footer` on the closing `<p>` ("Sources: Slack, GitHub, …")

Small, surgical, and avoids querying by emoji/text. The unit tests in `__tests__/standup-app.test.tsx` query by visible text today — they keep working because the `data-testid` adds are additive.

## 6. Open question (decide before writing §A3 / §E25)

`layout.tsx` and `components/standup-app.tsx` **both** render an `<h1>` ("📋 Daily Standup" in each). The layout's is the page-level heading; the inner one is the body's section heading. That is two `<h1>`s on one accessibility tree, which fails common axe rules and conflicts with §E25 above.

Options:
- (a) Demote the inner one to `<h2>`. Lowest-risk fix; update §A3 and §E25 to assert a single `<h1>`.
- (b) Drop the layout `<h1>` and keep only the body's. Bigger visual change, alters the consolidated header.
- (c) Accept the duplicate and assert "≥ 1 `<h1>` matches /Daily Standup/" in §A3, and remove §E25.

Recommendation: (a). Cheap, removes a real a11y warning, keeps the existing visual layout. Treat as a tiny prerequisite PR before this plan's specs.

## 7. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` flow — note `APP_SELF_ENROLL_SLUGS` already includes `standup` per `playwright.config.ts`, so the §A5 self-enroll test runs without further env wiring.

## 8. Out of scope

- Server-action tests — none exist (Standup has no server actions); nothing to duplicate.
- Aggregation pipeline (the cron/source code that **populates** the `days` table) — separate effort. E2E covers UI ← `days` only.
- Migration for the `days` table itself — there is currently no `supabase/migrations/*standup*` file; whoever owns the standup ingest pipeline owns that migration. These specs assume the table exists in the test database. If it does not, add a migration as a prereq PR (append-only rule + matching `.down.sql` per `CLAUDE.md` non-negotiable §5).
- Visual regression (screenshot diff) — separate effort.
- Cross-app session test that involves Standup — already covered in `tests/e2e/auth.spec.ts` (it's the `SECOND_APP`); don't duplicate here.

---

## Execution order

1. Resolve §6 (small a11y PR, no behavior change beyond `<h1>` → `<h2>`)
2. Add `data-testid` hooks (§5) — small PR, no behavior change
3. Add `tests/e2e/helpers/standup.ts` — DB seed/cleanup with id-prefix scoping
4. Confirm a `days`-table migration exists in `supabase/migrations/`; if not, file the prereq PR (see §8)
5. Write `access.spec.ts` + `render.spec.ts` first (highest value, lowest flake risk)
6. Layer in `filter.spec.ts`, then `static-content.spec.ts` and `a11y.spec.ts`
