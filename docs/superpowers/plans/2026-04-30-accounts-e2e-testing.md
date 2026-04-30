# Plan: E2E tests for the Accounts app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

The Accounts app (`apps/web/app/apps/accounts/`) is a **read-only client-intelligence dashboard**: a `<select>` of clients + a 5-tab dashboard (Overview, Contacts, GitHub, Meetings, Integrations) rendered from a `clients` Supabase table. There are no server actions, no mutations, no modals, no forms. That shapes this plan: **no Group B/CRUD, no Group "edit" tier**. Depth still matches Ideas because the rendering surface is large (8 conditional sections, 5 tabs, multiple status/health states, several empty states, and a `pending-reauth` Jira branch worth guarding against regression).

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used; required for seed/cleanup
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. Accounts has no entitlement gating (`tier: "free"`, no `features` flags), so no second user is needed.
- **Permissions**: registry has `permission: "view"` for accounts (not `edit`). In `beforeAll`, call `seedPermission(userId, "accounts", "view")`. Tear down after the suite. Why `view` and not `edit`: matches the registry's `permission` field — `requireAppLayoutAccess` uses that value as the minimum required level, and we want tests to mirror real production gating.
- **Prerequisite (BLOCKING — outside this plan's scope)**: there is no `clients` table migration in `supabase/migrations/`. Either (a) the migration must land first, or (b) the seed/cleanup helper below uses an existing local table created out-of-band. Note this in the rollout PR; do not stub it inside e2e helpers, as that hides drift between the test env and production.

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/accounts.ts` with service-role helpers:

- `seedClient(partial?: Partial<ClientRow>): Promise<Client>` — inserts directly, returns row. Defaults to a minimal valid record (id, name) plus whatever the test needs.
- `seedClients(count, factoryFn?)` — bulk; useful for the selector-renders-all test and the overview-stats aggregation test.
- `getClient(id)` — read-back assertion (sanity, not strictly needed for read-only UI but useful when verifying JSON-text round-trips).
- `deleteClientsByIds(ids[])` — cleanup; called in `afterEach`. Why ID-list and not "all": the `clients` table may legitimately contain non-test rows in shared environments — never blanket-delete.
- A small inline factory for nested JSON shapes (`urls`, `contacts`, `github`, `jira`, `netlify`, `contracts`, `standup`, `upcomingMeetings`, `contentfulSpaces`, `highlights`, `challenges`, `upcomingFocus`) — `queries.ts` parses each from text-as-JSON, so seeded rows must store these as JSON-encoded strings to mirror prod. Mismatching this would falsely green the suite.

Why DB-direct seeding (not UI): the app has no creation UI. Direct insert is the only path.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/accounts` redirects to login
2. Auth user without `accounts` permission → unauthorized page (the registry says `permission: "view"`, so even a `view`-only user must be granted explicitly)
3. Auth user with `accounts:view` permission → page renders with header "Accounts" and subtitle "Client Intelligence Hub" (layout fingerprint)
4. Page header (`PageHeader`) renders title "Accounts" + subtitle "Every client. One dashboard."
5. Empty-clients state: when zero rows exist, "No clients found" empty state renders (guards against regressions in the `!clients.length` branch)

### Group B — Overview stats (aggregation)

These read `computeOverviewStats(clients)` indirectly through StatCards. We seed deterministic data and assert math.

6. With 3 seeded clients → `Clients` StatCard reads `3`
7. PR aggregation: 2 clients with `github.openPRs = 5, 7` → `Open PRs` StatCard reads `12`
8. Contacts aggregation: clients with `contacts.length = 1, 2, 0` → `Contacts` StatCard reads `3`
9. Jira aggregation: clients with `jira.openTickets = 4, null, 8` → `Jira Tickets` StatCard reads `12` (covers the `?? 0` coalescing)

### Group C — Client selector & switching

10. Selector `<select>` lists every seeded client name, sorted ascending (queries.ts uses `.order("name", { ascending: true })`)
11. Default selection = first client (alphabetical)
12. Changing selector value swaps the rendered dashboard's contents (industry badge, health badge, tab content all update)
13. Industry badge in the selector chrome shows the selected client's industry; absent when industry is null
14. `<TabsTrigger>` selection state resets when client changes (the `key={selectedClient.id}` on `ClientDashboard` forces remount — explicit regression guard)

### Group D — Health indicator

15. `health: "good"` → green badge with text "good"
16. `health: "at-risk"` → amber badge
17. `health: "critical"` → red badge
18. `health: null` → no health row rendered at all

### Group E — Overview tab (default)

19. Company section: industry text shown when set; em-dash when null
20. URL buttons render conditionally — only `website` set → only Website button; only `production` set and ≠ website → only Production button; etc. (covers the `&&` gating per URL)
21. `urls.production === urls.website` → Production button suppressed (de-dup branch)
22. `urls.github` array → one repo button per entry, link `https://github.com/last-rev-llc/{repo}`
23. Highlights/Challenges side-by-side: lists render with check/warn glyphs; "None this week" empty state when array empty/missing
24. Upcoming Focus list renders bullets; "No priorities set for next week" when empty
25. Contracts: each contract row shows type badge, status badge color (`active`→green, `expiring-soon`→amber, `expired`→red, other→gray), date range, retainer/hourly when present; "No contracts on file" empty state

### Group F — Contacts tab

26. Click Contacts tab → tabpanel becomes active and lists every contact
27. Primary contact → "Primary" badge + highlighted border style
28. Email → mailto link; LinkedIn → external link with `target="_blank" rel="noopener noreferrer"` (security regression guard, since these are user-supplied URLs)
29. Empty contacts → "No contacts added yet"

### Group G — GitHub tab

30. Open PR count rendered numerically; styled red/accent when `openPRs > 5`, default when ≤ 5
31. `openPRs > 10` → "Needs attention" badge appears; ≤ 10 → not present
32. `gh.repos[]` → repo buttons render with correct external URL
33. `gh.prs[]` → PR rows show `#number`, title, author display name, and external link to `github.com/last-rev-llc/{repo}/pull/{number}`
34. No repos and no PRs → "No repos linked" empty state
35. Repo name URL-encoding: seed a repo with characters needing encoding (`feat/foo`) → assert `encodeURIComponent` is applied in the link href (the source uses `encodeURIComponent(pr.repo)`)

### Group H — Meetings tab

36. Standup section "Yesterday" / "Today" lists render entries with user, item, and ticket badge when present; ticket and PR external links open in new tab
37. Standup with both arrays empty → "No standup data" empty state
38. Standup with one side empty → other side renders, "Nothing logged" / "Nothing planned" sub-empties (covers nested branch)
39. Upcoming Meetings: title, formatted datetime (LA timezone — assert text matches the formatter for a known ISO input), and attendee list with `accepted`/`pending`/`declined` glyphs
40. No meetings → "No upcoming meetings scheduled"

### Group I — Integrations tab

41. Jira: `status: "active"` → renders openTickets and staleTickets numbers
42. Jira: `status: "pending-reauth"` → warning banner "Jira integration pending re-auth" (high-value regression — silently failing reauth has been a real prod incident pattern)
43. Jira: missing → "No Jira integration configured" empty
44. Contentful: spaces array → space name + environment badges; empty → "No Contentful spaces linked"
45. Netlify: each site row shows site name, status badge color (`success`→green, `failed`→red, `pending`→amber), last-deploy text; empty → "No Netlify sites configured"

### Group J — A11y / regression

46. Keyboard nav: Tab into the selector, ArrowDown changes value, dashboard re-renders (proves the `<select>` is operable without mouse)
47. Tab list keyboard nav: Left/Right arrow moves between TabsTriggers; Enter activates (Radix default; guards against accidental override)
48. External-link safety audit: every `target="_blank"` link in Contacts/GitHub/Standup also has `rel="noopener noreferrer"` (one assert per tab — protects users from tabnabbing and is a class of bug that creeps back in)

## 4. Spec organization

```
apps/web/tests/e2e/accounts/
  access.spec.ts          # A
  overview-stats.spec.ts  # B (page-level StatCards)
  selector.spec.ts        # C (client switching)
  health.spec.ts          # D
  overview-tab.spec.ts    # E
  contacts-tab.spec.ts    # F
  github-tab.spec.ts      # G
  meetings-tab.spec.ts    # H
  integrations-tab.spec.ts # I (Jira/Contentful/Netlify)
  a11y.spec.ts            # J
```

Each file: `beforeAll` seeds permission + the specific clients fixture data; `afterEach` deletes those seeded ids; uses the shared `loggedInPage` fixture. Why split per-tab rather than one giant `dashboard.spec.ts`: each tab is its own conditional render tree with distinct empty/loaded states — splitting keeps each spec under ~150 lines and lets failures point to a single tab.

## 5. Selector strategy (do this before writing specs)

Currently the components use semantic roles (`tab`, `tabpanel`, `combobox`, `option`) and visible text — good for the unit tests already in `__tests__/`, but text-based selectors are fragile across icon/copy tweaks. Add `data-testid` hooks to the high-traffic interactions in `accounts-app.tsx`:

- `client-selector` (the `<select>`), `client-selector-industry` (the right-side industry pill), `client-health-badge`
- `tab-${overview|contacts|repos|meetings|integrations}`
- `overview-section-${company|highlights|challenges|focus|contracts}`
- `url-button-${website|production|staging}`, `repo-button-${repo}`
- `contact-row`, `contact-row-primary` (modifier), `contact-email`, `contact-linkedin`
- `pr-row`, `pr-link`, `pr-count`, `pr-needs-attention`
- `standup-yesterday`, `standup-today`, `standup-row`
- `meeting-row`, `meeting-attendee`
- `jira-status`, `jira-reauth-banner`, `netlify-row`, `contentful-space`
- `stat-card-${clients|prs|contacts|jira}` on `<StatCard>` (small change in `@repo/ui` or the page)

Small, surgical, and avoids querying by emoji/text. Why now: every selector here will be referenced by 1–4 specs; without testids the suite churns whenever copy changes.

## 6. Running

- `pnpm --filter web test:e2e` → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: note `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts` currently lists only `command-center,standup`. Either (a) add `accounts` so the test user can self-enroll, OR (b) rely on the explicit `seedPermission(userId, "accounts", "view")` in `beforeAll`. The plan recommends (b) — keeps the test surface tight and doesn't change prod-adjacent config for a test concern.
- DB prereq: a `clients` table must exist in the test database (see §1 BLOCKING note).

## 7. Out of scope

- Component-level rendering covered by Vitest in `apps/web/app/apps/accounts/__tests__/` — don't duplicate; e2e covers the auth → DB → UI render path only.
- The `getClient(id)` query function (used by no UI as of 2026-04-30) — covered by `lib/__tests__/queries.test.ts`.
- Visual regression (screenshot diff) — separate effort.
- Mutation paths — none exist in this app.
- Auth0 login itself — covered by `auth.spec.ts`.

---

## Execution order

1. Land the `clients` table migration (BLOCKING prereq, separate PR)
2. Add `data-testid` hooks (§5) — small PR, no behavior change
3. Add `tests/e2e/helpers/accounts.ts` — DB seed/cleanup with JSON-stringification of nested fields
4. Write `access.spec.ts` + `overview-stats.spec.ts` first (highest value, lowest flake risk — exercises the auth→render→aggregate path that all other specs depend on)
5. Layer in D (health), E (overview tab), F–I (one tab spec at a time)
6. C (selector switching) after the per-tab specs land — easier to assert "tab content updated" once the tab specs define the assertion vocabulary
7. J (a11y/regression) last — polish, with the security-relevant `rel="noopener"` assertions baked in
