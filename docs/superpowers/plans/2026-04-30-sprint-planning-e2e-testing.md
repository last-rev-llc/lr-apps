# Plan: E2E tests for the Sprint Planning app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. Sprint Planning is **read-only**: server-side it pulls archive rows from `daily_digests` / `daily_overviews` / `weekly_summaries`; client-side it `fetch`es a static `/apps/sprint-planning/data/backlog-meeting.json`. There is no Create/Edit/Delete UI, so this plan intentionally **omits Group B (CRUD)** — adding it would be invented coverage. We extend, not replace.

App config snapshot (from `apps/web/lib/app-registry.ts`): `slug: "sprint-planning"`, `subdomain: "sprint"`, `routeGroup: "apps/sprint-planning"`, `auth: true`, `permission: "view"`, `template: "full"`, `tier: "free"`. The layout calls `requireAppLayoutAccess("sprint-planning")` so unauth/un-permissioned access redirects per the standard registry rules.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used; required to seed archive rows + permissions
  - No second user / pro entitlement needed — `tier: "free"` and there are no `features` overrides
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. The `unauthPage` fixture covers the redirect-to-login case.
- **Permissions**: `sprint-planning` is **not** in `APP_SELF_ENROLL_SLUGS` (only `command-center,standup` are wired into `playwright.config.ts` `webServer.env`). Therefore in `beforeAll`, call `seedPermission(userId, "sprint-planning", "view")`. Tear down after. Adding `sprint-planning` to the self-enroll list is an alternative but seeding is more deterministic and matches the Ideas plan pattern.

## 2. Test data strategy (the work that doesn't exist yet)

Sprint Planning has **two data sources**, each requiring its own seeding strategy:

### 2a. Archive rows (server-side, real DB)

Add `tests/e2e/helpers/sprint-planning.ts` with service-role helpers:

- `seedDigest(partial?: Partial<DigestRow>): Promise<DigestRow>` — inserts into `daily_digests`
- `seedOverview(partial?: Partial<OverviewRow>): Promise<OverviewRow>` — inserts into `daily_overviews`
- `seedWeekly(partial?: Partial<WeeklyRow>): Promise<WeeklyRow>` — inserts into `weekly_summaries`
- `deleteSeededArchives(ids: { digests: string[]; overviews: string[]; weeklies: string[] })` — cleanup; called in `afterEach`

Why DB-direct seeding (not UI): there is no UI to create archive records — they're populated by external pipelines. Tests must shape DB state up-front.

> **Open question / blocker**: there is no migration in `supabase/migrations/` for `daily_digests`, `daily_overviews`, or `weekly_summaries` (verified 2026-04-30). The app reads these tables, so they must already exist in the target Supabase project (likely created out-of-band or owned by another stack). Step 0 of execution is to **confirm the schema** (column names + types) by running `\d daily_digests` etc. against the test Supabase before writing the helper. If the tables do not exist in CI, decide between (a) adding a migration that creates them or (b) mocking the route-level fetch. This plan assumes (a).

### 2b. Backlog JSON (client-side `fetch`)

The agenda tab `fetch`es `/apps/sprint-planning/data/backlog-meeting.json` at runtime. There is no such file in `apps/web/public/` today (verified). Two options:

1. **Route-mock with `page.route()`** — fast, no filesystem mutation, isolated per test. Use a tiny `mockBacklog(page, data)` helper.
2. **Write a temp public file** — closer to prod but pollutes the repo and races across parallel workers.

**Pick option 1.** It mirrors how the unit test in `__tests__/sprint-app.test.tsx` mocks `fetch` and keeps tests hermetic. The helper:

```ts
// tests/e2e/helpers/sprint-planning.ts
export async function mockBacklog(page: Page, data: SprintData | "fail") { ... }
```

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/sprint-planning` redirects to login (covers `auth: true` + `requireAppLayoutAccess`)
2. Auth user **without** `sprint-planning` permission → unauthorized page (covers `permission: "view"` enforcement)
3. Auth user **with** `sprint-planning:view` → page renders with header "Sprint Planning" + 📋 icon and h2 "Sprint Backlog"
4. Tabs render: "📋 Agenda" and "📁 Archives" both visible and clickable

> No tier/upgrade test — Sprint Planning is `tier: "free"` with no per-feature overrides. There is nothing gated behind billing.

### Group B — CRUD

**Intentionally empty.** Sprint Planning has no create/edit/delete UI; archive rows and the backlog JSON are written by external systems. Inventing CRUD specs here would be padding.

### Group C — Agenda tab: backlog rendering

Each test mocks `fetch` to `/apps/sprint-planning/data/backlog-meeting.json` via `page.route()`.

5. `fetch` returns 404/!ok → "No backlog data yet" `EmptyState` renders
6. `fetch` returns `{ clients: [] }` → same empty state
7. `fetch` returns one client with mixed-status items → `ClientCard` renders client name, total count, "outstanding"/"blocked"/"done" counts in header
8. `fetch` resolves with `lastUpdated` → "Last updated: …" timestamp visible
9. Multiple clients → multiple cards in source order
10. Loading state ("Loading sprint data…") shown before fetch resolves (use `page.route()` with a delay)

### Group D — Status grouping & ordering

11. Items grouped by status under correct labels: 🛑 Blocked / 🔄 In Progress / 👀 In Review / 📋 Not Started / 💬 Needs Discussion
12. Status order matches `OUTSTANDING_ORDER` in component (blocked first, discussion last among outstanding)
13. Each `StatusGroup` shows `(count)` matching items in that status
14. "Outstanding & Next Week" section header renders only if at least one outstanding-status group has items
15. "Highlights — What Got Done" section header renders only if `done` items exist
16. Done section is **collapsed by default** — click toggle → done items become visible; click again → hidden
17. Client card with zero items → "No items" `EmptyState` inside the card (not the page-level one)

### Group E — Item row badges & links

18. `priority: "high"` → destructive Badge variant; `medium` → secondary; `low` → outline (computed-style sniffing only — variant class name presence)
19. `dueDate` in past → "Overdue" destructive badge; `dueDate` tomorrow → "Due tomorrow"; future date → "Due {Mon D}"
20. Item with `sources: [{ type: "jira", url }]` → title is rendered as anchor with `target="_blank"` and `rel="noopener noreferrer"`
21. Item without a Jira source URL → title is plain text (no anchor)
22. Source pills render with correct emoji per type (jira 🎫, slack 💬, zoom 📹, github 🔗-fallback) and link out where `url` provided
23. Multiple `assignees` → one Badge each, secondary variant

### Group F — Archives tab

Each test seeds at least one row of each type via the helpers, navigates to `/apps/sprint-planning`, switches to the Archives tab.

24. Empty archives → "No archive records found" EmptyState
25. Mixed seeded data → at least one Digest, Overview, Weekly badge visible
26. Type filter buttons render: "All" / "Daily Digests" / "Daily Overviews" / "Weekly Summaries"
27. Click "Daily Digests" → only Digest cards visible; Overview/Weekly hidden
28. Click "Daily Digests" → service filter sub-row appears with All/slack/jira/zoom/github/calendar
29. Click "slack" service filter → only digest rows whose `service === "slack"` remain
30. Switch back to "All" type → service filter row disappears
31. Date range filter: seed records dated -2d / -8d / -45d. Default "Last 30 days" hides -45d. Click "Last 7 days" → also hides -8d. Click "All time" → all visible.
32. Click an archive card → expands to show full summary (when truncated) + items/highlights/blockers/action_items lists per type
33. Truncation: card with `summary.length > 200` shows "…" preview; expanded view shows full text under "Full Summary" header
34. Service-specific class colour applied to service Badge (e.g. `bg-brand-slack` for slack-typed digest) — assert class presence

### Group G — Tab navigation & state

35. Default tab is "agenda"
36. Switch agenda → archives → agenda; agenda backlog data is **not refetched** (the `useEffect` runs once on mount). Assert `fetch` mock called exactly once across tab switches.
37. Filter state on Archives tab persists when navigating tabs and back (Tabs component default behaviour — guards against accidental remount)

### Group H — A11y / regression

38. Tabs are keyboard-navigable: ArrowRight on "Agenda" focuses "Archives", Enter activates
39. Archive card expand/collapse works via Enter on the card (currently the card relies on `onClick` only — this test will surface a real a11y gap; document as either fix-or-skip during execution)
40. Status emoji glyphs render (regression guard) — assert presence of "🛑", "🔄", "👀" text in the rendered DOM when blocked/in-progress/in-review items exist; protects against an accidental class-name-collision sweep

## 4. Spec organization

```
apps/web/tests/e2e/sprint-planning/
  access.spec.ts             # A
  agenda-rendering.spec.ts   # C
  agenda-grouping.spec.ts    # D
  agenda-badges.spec.ts      # E
  archives.spec.ts           # F
  tab-navigation.spec.ts     # G
  a11y.spec.ts               # H
```

No `crud.spec.ts` — Group B is intentionally empty.

Each file: `beforeAll` seeds permission + (where needed) archive rows; `afterEach` clears that user's seeded archives; uses the shared `loggedInPage` fixture; uses `page.route()` to mock the backlog JSON fetch.

## 5. Selector strategy (do this before writing specs)

The component currently relies on text + emoji + role queries. To keep tests stable as copy/icons evolve, add `data-testid` hooks to the high-traffic interactions in `sprint-app.tsx`:

- `sprint-tabs`, `sprint-tab-agenda`, `sprint-tab-archives`
- `client-card`, `client-card-header`, `client-card-empty`
- `status-group-${status}` (one per `SprintStatus`)
- `sprint-item-row`, `sprint-item-title`, `sprint-item-priority`, `sprint-item-due-date`, `sprint-item-source-${type}`
- `done-section-toggle`, `done-section-body`
- `archive-card`, `archive-card-${id}`, `archive-card-summary`, `archive-card-expanded`
- `archive-filter-type-${all|digest|overview|weekly}`
- `archive-filter-service-${all|slack|jira|zoom|github|calendar}`
- `archive-filter-range-${7|30|all}`
- `agenda-loading`, `agenda-empty`, `agenda-last-updated`

Small, surgical, and avoids querying by emoji — emoji glyphs change.

## 6. Running

- `pnpm --filter web test:e2e` → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` already in `webServer.command` flow. **Note**: `playwright.config.ts` `webServer.env.APP_SELF_ENROLL_SLUGS` defaults to `"command-center,standup"`. Either:
  - (a) extend the env list to include `"sprint-planning"` when running these specs, **or**
  - (b) rely on `seedPermission` per-spec (preferred; matches the Ideas plan)

## 7. Out of scope

- **Server-action / unit tests already exist** in `apps/web/app/apps/sprint-planning/__tests__/{layout,page,sprint-app}.test.tsx` — comprehensive coverage of layout auth, page query plumbing, and component rendering. E2E covers the browser→app→DB happy paths only and explicitly does not duplicate them.
- **`backlog-meeting.json` content validation** — the JSON shape is exercised through the agenda tests; we don't validate JSON-schema-style at the e2e layer.
- **Visual regression** (screenshot diff) — separate effort.
- **External pipelines** populating `daily_digests` / `daily_overviews` / `weekly_summaries` — these tests assume the schema is in place (see §2a open question) and seed rows directly.
- **CRUD tests** — see §3 Group B.

---

## Execution order

1. Resolve the §2a open question — confirm `daily_digests` / `daily_overviews` / `weekly_summaries` schemas in the test Supabase, or add a migration. Without this, no Archives test can run.
2. Add `data-testid` hooks (§5) — small PR, no behaviour change
3. Add `tests/e2e/helpers/sprint-planning.ts` — DB seed/cleanup + `mockBacklog(page, data)` route helper
4. Write `access.spec.ts` first (highest value, lowest dependencies — no archive seeds, no JSON mock)
5. Write `agenda-rendering.spec.ts` + `agenda-grouping.spec.ts` (depend only on `mockBacklog`)
6. Write `agenda-badges.spec.ts` (priority/due-date/source-link assertions)
7. Write `archives.spec.ts` (depends on §2a being resolved)
8. Layer in `tab-navigation.spec.ts` and `a11y.spec.ts` last
