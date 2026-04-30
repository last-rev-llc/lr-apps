# Plan: E2E tests for the Summaries app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Summaries is a **read-only** app (`template: "full"`, `tier: "free"`, `permission: "view"`) that surfaces meeting/thread/ticket summaries ingested from Zoom, Slack, and Jira into three tables (`summaries_zoom`, `summaries_slack`, `summaries_jira`). There is no UI for create/edit/delete — ingestion happens externally. That shapes everything below: there is no Group B (CRUD), and the helper is a pure seed/teardown utility, not a write-API surrogate.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used by `helpers/db.ts`
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. Summaries has no Pro entitlement gates, so a single test user suffices.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "summaries", "view")` so the test user can reach `/apps/summaries`. Tear down after. The registry entry uses `permission: "view"` — do NOT seed `edit`; it would still pass but masks whether the layout actually enforces the configured level.
- **Self-enroll caveat**: `playwright.config.ts` only adds `command-center,standup` to `APP_SELF_ENROLL_SLUGS` for the CI `next start` server. Summaries is NOT self-enroll, so we must rely on `seedPermission`. Keep it that way — adding it to the env list would silently bypass the access tests below.

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/summaries.ts` with service-role helpers that seed all three source tables. We seed directly via the service-role client because the app has no write API and the underlying tables are populated by external ingestion pipelines (Zoom/Slack/Jira webhooks), which we cannot drive from a test.

- `seedZoomSummary(partial?: Partial<ZoomSummary>): Promise<ZoomSummary>` — inserts into `summaries_zoom`, returns row
- `seedSlackSummary(partial?: Partial<SlackSummary>): Promise<SlackSummary>` — inserts into `summaries_slack`
- `seedJiraSummary(partial?: Partial<JiraSummary>): Promise<JiraSummary>` — inserts into `summaries_jira`
- `seedFixtureBundle()` — convenience helper that inserts a known mix (e.g. 2 zoom, 2 slack across 2 channels, 2 jira with mixed priority+status, spanning two days) so filter/tab tests have a stable shape
- `deleteAllTestSummaries()` — deletes rows whose `id` was created by the fixture (track ids in-memory or namespace with a `e2e-` prefix on `meeting_id`/`thread_ts`/`ticket_key`); called in `afterEach` to keep tests independent

Why DB-direct seeding (not UI): there is no UI to create summaries. The only alternative would be calling Zoom/Slack/Jira ingest endpoints, which is out of scope for an app-level e2e suite.

**Schema caveat**: this repo's `supabase/migrations/` directory contains no `summaries_*` table definitions, so the schema lives elsewhere (likely managed by an upstream service or a not-yet-checked-in migration). Before writing the helper, confirm column names against the live Supabase project (`participants`/`action_items`/`key_decisions` are stored as JSON per `lib/queries.ts`'s `parseJsonField`). If the columns drift, the helper is the single point to update.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/summaries` redirects to login
2. Auth user without `summaries` permission → unauthorized page (registry-configured `view` is the gate)
3. Auth user with `summaries:view` permission → page renders with header "📋 Summaries" and tagline "Cut through the noise"
4. Stat-card row renders four cards (Total / Zoom / Slack / Jira) with counts that match seeded data

### Group C — Tabs & data routing

5. Default tab is "All" — count badge in tab trigger equals zoom+slack+jira count
6. Click Zoom tab → only `📹 Zoom` cards visible in active panel; titles match seeded `meeting_topic` values
7. Click Slack tab → only `💬 Slack` cards visible; channel pill `#<channel_id>` rendered
8. Click Jira tab → only `🎯 Jira` cards visible; titles match seeded `ticket_key` values
9. Tab counts in triggers (e.g. `Zoom (2)`) match seeded counts per source

### Group D — Card expansion (per-source render contracts)

10. Zoom card: click to expand → "Action Items" section lists each seeded item; "Key Decisions" section lists each seeded decision
11. Zoom card with empty `action_items` AND empty `key_decisions` → expands but neither section renders (negative case for the conditional blocks in `summaries-app.tsx`)
12. Slack card: click to expand → "Participants" section renders each seeded participant
13. Slack card with `tone` set → tone pill (`positive`/`neutral`/`negative`) appears in collapsed state with the right color class
14. Jira card with `priority` and `status` → priority pill + status pill render in collapsed state; status underscore is replaced with space (`in_progress` → `in progress`)
15. Long summary section: when `long_summary !== short_summary` → "Full Summary" block renders; when equal or null → it does not (guards the dedupe branch in the card)

### Group E — Filtering, search, date range

16. All-tab search by zoom `meeting_topic` substring → list narrows to matching zoom card only; other tabs unaffected
17. All-tab search by slack `short_summary` substring → matching slack card visible
18. All-tab search by jira `ticket_key` substring → matching jira card visible
19. Search with no match → "No summaries found" empty state renders (the `📋` block in `GroupedList`)
20. Slack tab: select channel from dropdown → only summaries from that channel remain
21. Slack tab: channel dropdown is populated from distinct seeded `channel_id` values (verifies `getSlackChannels` dedup)
22. Jira tab: priority filter (e.g. `high`) → only that-priority cards visible
23. Jira tab: status filter (e.g. `in_progress`) → only that-status cards visible
24. Jira tab: combine priority + status → AND semantics (both must match)
25. Date-range From/To on All tab: seed two items dated different days, set range to one day → only that day's items visible
26. Date-range edge: `to` includes the full end-of-day (the helper sets `setHours(23,59,59,999)`) — seed a 23:30Z item and a 00:30Z next-day item, set `to=<seeded day>` → only the same-day item appears (regression guard for the off-by-one)
27. Per-tab filter state independence: type a query in Zoom tab, switch to Slack tab → Slack search input is empty (each tab owns its own state)

### Group F — Day grouping & ordering

28. Items dated today → group label renders as "Today"
29. Items dated yesterday → group label renders as "Yesterday"
30. Older dated items → group label renders as `Mon D` (e.g. `Apr 8`); seed deterministic dates so the assertion is stable across CI clock drift
31. Within a group, items are ordered by `created_at` descending (most recent first)
32. Across groups, groups are ordered by date descending — newest day first

### Group G — Empty state

33. With zero seeded rows → "No summaries found" + "Try adjusting your filters" sub-copy renders on the All tab
34. Switch to a source tab with zero rows of that source → same empty state renders inside the active tab panel

### Group H — A11y / regression

35. Keyboard tab navigation moves focus through tab triggers; Enter/Space activates a tab (Radix default behavior — guards against accidental override in our wrapper)
36. Clicking a card toggles the chevron rotation class (`rotate-90`) — small smoke test for the expand/collapse state, asserted via computed style on the chevron element

## 4. Spec organization

```
apps/web/tests/e2e/summaries/
  access.spec.ts           # A
  tabs.spec.ts             # C
  card-expansion.spec.ts   # D
  filters-search.spec.ts   # E
  grouping.spec.ts         # F
  empty-state.spec.ts      # G
  a11y.spec.ts             # H
```

Each file: `beforeAll` seeds permission + the relevant fixture bundle; `afterEach` clears seeded summaries; uses the shared `loggedInPage` fixture. Note there is intentionally no `crud.spec.ts` because Summaries has no write surface — see §2 for rationale.

## 5. Selector strategy (do this before writing specs)

Currently `summaries-app.tsx` and the layout rely on emoji + text + Radix-default `role="tab"` selectors. The unit tests in `apps/web/app/apps/summaries/__tests__/summaries-app.test.tsx` already lean on these (e.g. `getByText("📹 Zoom")`), and they are fragile to copy/emoji changes. Add `data-testid` hooks to high-traffic interactions before writing specs:

- `summaries-tab-${all|zoom|slack|jira}`
- `summary-card`, `summary-card-${zoom|slack|jira}`, `summary-card-title`, `summary-card-chevron`
- `summary-card-expanded`, `summary-card-action-items`, `summary-card-key-decisions`, `summary-card-participants`, `summary-card-long-summary`
- `summaries-search-${all|zoom|slack|jira}`
- `summaries-date-from-${tab}`, `summaries-date-to-${tab}`
- `summaries-channel-select`, `summaries-priority-select`, `summaries-status-select`
- `summaries-empty-state`
- `summary-pill-source`, `summary-pill-tone`, `summary-pill-priority`, `summary-pill-status`

Keep the testids surgical and avoid querying by emoji — emoji rendering varies by font/platform and breaks under headless Chromium.

## 6. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` — `summaries` is NOT in `APP_SELF_ENROLL_SLUGS` and should stay that way (see §1). Tests rely on `seedPermission` to grant access.
- Test data is namespaced (e.g. `meeting_id` prefixed with `e2e-`) so a leaked row from a prior failed run doesn't pollute manual exploration.

## 7. Out of scope

- Component-level rendering tests already exist in `apps/web/app/apps/summaries/__tests__/{layout,page,summaries-app}.test.tsx` — the e2e suite covers the UI→DB→server-component round trip, not unit-level conditional rendering. The two layers should reinforce each other, not duplicate.
- Ingestion-pipeline tests (Zoom/Slack/Jira webhooks → `summaries_*` rows) — that lives with the upstream services, not this app.
- Visual regression (screenshot diff) — separate effort.
- Cross-tenant isolation: summaries appear shared across users (no `user_id` column in the queries' `select *`). If multi-tenancy is added later, add a Group B for row-level access.

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change. Update existing vitest specs to query by testid where it stabilizes them.
2. Add `tests/e2e/helpers/summaries.ts` — DB seed/cleanup, with the `e2e-` id namespace so cleanup is safe to run.
3. Write `access.spec.ts` + `tabs.spec.ts` first (highest value, lowest flake risk — they exercise auth gating and the basic data path).
4. Layer in D (expansion) and E (filtering) — these are the bulk of the suite.
5. Grouping (F) and empty state (G) are quick to add once helpers exist.
6. A11y (H) last; the chevron-rotation regression test in particular is cheap insurance against a Tailwind class purge.
