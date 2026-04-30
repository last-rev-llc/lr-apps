# Plan: E2E tests for the Sales app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Sales is read-only today — `apps/web/app/apps/sales/page.tsx` calls `getLeads()` (server-side fetch from `public.leads`) and renders `LeadsApp`. The UI provides search, fit-score filter (`all` / `5+` / `7+`), sort (score/name/date with asc/desc toggle), and List vs Pipeline tabs. There is no create/edit/delete in the app; the migration `20260409_leads.sql` grants only `select` to `authenticated`, with no app-side server actions. Leads are global (not per-user), so seeding/cleanup is a shared-table concern.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used; required for seeding `leads`
  - No second/pro user needed: Sales is `tier: "free"` and exposes no entitlement-gated features today
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "sales", "view")` so the test user can reach `/apps/sales` (registry default permission is `view`). Tear down after.
- **CI self-enroll note**: `playwright.config.ts` only injects `APP_SELF_ENROLL_SLUGS=command-center,standup`. Sales is not auto-enrolled, which is fine — the `seedPermission` call in `beforeAll` is the chosen path. Do NOT add `sales` to `APP_SELF_ENROLL_SLUGS`; explicit seeding keeps the access tests honest.

## 2. Test data strategy (the work that doesn't exist yet)

`leads` is a global table (RLS allows any authenticated user to read every row), so test data leaks across users by design. Two consequences:
- We cannot rely on "the test user's leads" the way Ideas does. Helpers must scope cleanup by a tag we own (e.g. `source` field set to `e2e-{runId}` or a name prefix like `e2e-`).
- Tests must be tolerant of pre-existing rows from the real dataset. Assertions count/look up only the seeded rows, never `toHaveLength(N)` on the whole list.

Add `tests/e2e/helpers/sales.ts` with service-role helpers:

- `seedLead(partial?: Partial<LeadRow>): Promise<Lead>` — inserts directly with `source = "e2e"` and a unique `name`/`domain` containing the run-id; returns the row
- `seedLeads(count, factoryFn?)` — bulk; useful for filter/sort tests that need a controlled distribution of `fitScore` and `stage`
- `getLead(id)`, `listLeadsBySource(source)` — assertion reads
- `deleteLeadsBySource(source)` — cleanup; called in `afterEach`/`afterAll` to keep tests independent and avoid polluting the dev DB

Why DB-direct seeding: there is no UI path to create a lead, so the only way to set up "5 leads with mixed fit scores and stages" is service-role insert. This also keeps tests independent of the real lead pipeline.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/sales` redirects to login
2. Auth user without `sales` permission → unauthorized page (Sales is not in `APP_SELF_ENROLL_SLUGS`, so no auto-enroll happens in CI)
3. Auth user with `sales:view` permission → page renders with header "💰 Sales" (layout) and section title "💰 Sales Pipeline" (page header)
4. Page header subtitle reflects counts: "{N} companies · {M} contacts" — assert format, not exact numbers (shared DB)

### Group B — Create / Edit / Delete (CRUD)

N/A. Sales has no UI mutation surface today. Migration `20260409_leads.sql` has no INSERT/UPDATE/DELETE policy, the page is server-rendered with `dynamic = "force-dynamic"`, and `LeadsApp` mutates only client-side view state. Reintroduce this group when a "New Lead" or "Edit stage" surface ships.

### Group C — Search

5. Type a seeded company name into the search box → only matching `LeadCard` rows render in the List tab
6. Search by domain substring → matched (component matches on `domain.toLowerCase().includes(q)`)
7. Search by a person's name (a seeded `people[].name`) → parent lead row matched (component matches on `people[].name`)
8. Search with no matches → `EmptyState` renders with "No leads match your search"
9. Clearing the search restores the seeded rows

### Group D — Fit filter

10. Default filter is "All" — all seeded rows visible
11. Click "Fit 5+" → only seeded rows with `fitScore >= 5` visible (seed e.g. one each of 3, 5, 8)
12. Click "Fit 7+" → only the 8-score row visible; the 5-score row hides
13. Clicking the active filter button is a no-op (the component doesn't toggle off — verify the row count is unchanged so future refactors don't accidentally introduce a toggle-off behavior)

### Group E — Sort

14. Default sort: Fit Score, descending — seeded rows ordered 8 → 5 → 3 in the List tab
15. Click "Fit Score" again → direction toggles to ascending; arrow indicator flips to "↑"
16. Click "Name" → sort key changes to name; direction resets to desc (verify against seeded names like "e2e-zulu", "e2e-mike", "e2e-alpha")
17. Click "Date" → sorts by `researchedAt`; null/undefined dates sort to end via `localeCompare("")` semantics
18. Active sort button shows arrow indicator (`↓`/`↑`); inactive sort buttons do not

### Group F — Tabs (List vs Pipeline)

19. Default tab is List — `LeadCard`s rendered in a flat vertical stack
20. Click Pipeline tab → five stage columns render in order: Prospect, Outreach, Qualified, Proposal, Closed (with `🔍 / 📤 / ✅ / 📋 / 🏆` emojis)
21. Each column shows a count badge equal to the number of seeded leads in that stage
22. Empty stage column renders the "No leads" placeholder
23. Seeded leads appear under their `stage` column; a lead with `stage: null` does NOT appear in any pipeline column (it's filtered out in pipeline view) but IS visible in the list view — this asymmetry is product behavior worth pinning
24. Search + fit filter apply identically to both tabs (seed one in `prospect` and one in `qualified`, search for the prospect, switch to Pipeline tab → only the prospect column shows the row)

### Group G — Lead card content & links

25. Fit-score badge color band: <5 red, 5–7 amber, >=8 green — assert `data-testid` + computed-style of the score wrapper, not raw colour-mix expressions
26. Tech badges render for each entry in `techStack.cms / framework / hosting / other[]`
27. Accent-tech regex (`contentful|next.?js|react`) gives those badges a different style — assert distinct `data-testid` or class on at least one accent vs non-accent tech
28. Domain link points to `https://{domain}` and opens in a new tab (`target="_blank" rel="noopener noreferrer"`)
29. LinkedIn / Twitter social link icons render only when `socialLinks.linkedin` / `socialLinks.twitter` are set
30. Description renders only when `lead.description` is non-empty
31. News links render with title + relative date when `news[].date` is set
32. Footer "Researched {date}" renders only when `researchedAt` is set; "Source: {source}" renders only when `source` is set

### Group H — Expandable sections (per-card UI state)

33. "Fit Reasons (n)" section is collapsed by default; click expands; bullets render `fitReasons[]`
34. "Talking Points (n)" same expand/collapse behavior
35. "Contacts (n)" same; people list shows name, title, "Decision Maker" badge when `decisionMaker: true`, topic chips, and LinkedIn link
36. Two cards' expansion state is independent (open card A, card B stays closed) — guards against the `expandedSections` map keying regression

## 4. Spec organization

```
apps/web/tests/e2e/sales/
  access.spec.ts          # A
  search.spec.ts          # C
  fit-filter.spec.ts      # D
  sort.spec.ts            # E
  tabs.spec.ts            # F (list vs pipeline)
  lead-card.spec.ts       # G + H (card content, links, expand/collapse)
```

Each file: `beforeAll` seeds permission + a controlled set of `e2e-`-prefixed leads via service role; `afterAll` deletes by source. Tests assert on the seeded subset only (e.g. `getByTestId("lead-card").filter({ hasText: "e2e-" })`) so the shared-table reality doesn't cause flakes.

## 5. Selector strategy (do this before writing specs)

The component currently uses text + emoji + a few links. To stabilize against copy/style changes, add `data-testid` hooks in `leads-app.tsx`:

- `lead-card`, `lead-card-name`, `lead-card-fit-score`, `lead-card-fit-band` (the colored wrapper, for color assertions)
- `search-input` (or rely on `Search` already exposing one; verify before adding)
- `fit-filter-${all|5+|7+}` (note `+` is unsafe in some selector engines — use `5plus` / `7plus`)
- `sort-${score|name|date}` plus `sort-direction-indicator`
- `tab-list`, `tab-pipeline`
- `pipeline-column-${prospect|outreach|qualified|proposal|closed}`, `pipeline-column-count`
- `tech-badge`, `tech-badge-accent` (paired with the accent regex match)
- `expand-toggle-${reasons|tp|people}-${leadId}` so two cards' state is independently addressable
- `domain-link`, `linkedin-link`, `twitter-link`, `news-link`

Small, surgical, and avoids querying by emoji/text for high-traffic interactions.

## 6. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` already in `webServer.command` flow — `APP_SELF_ENROLL_SLUGS` should NOT include `sales` (we want the negative-access test in Group A #2 to fail closed). `seedPermission` covers the positive cases.

## 7. Out of scope

- Component unit tests already exist in `apps/web/app/apps/sales/__tests__/leads-app.test.tsx` (search, tabs, empty state) — don't duplicate; e2e covers the loaded-from-DB→server-render→hydrate path that unit tests can't.
- Visual regression (screenshot diff) — separate effort; the fit-band color check in G25 is the only computed-style assertion we keep.
- The Command Center "leads module" referenced in the migration comment — out of scope for this app's spec; it should get its own plan when wired up.
- CRUD specs — N/A until a mutation surface ships in Sales (see §3 Group B note).

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Add `tests/e2e/helpers/sales.ts` — DB seed/cleanup keyed by `source = "e2e"` so we never delete real pipeline data
3. Write `access.spec.ts` + `search.spec.ts` first (highest value, lowest flake risk)
4. Layer in D (fit filter) and E (sort) — both are pure client-state tests once seeding is in place
5. F (tabs) — adds the pipeline-column count + null-stage asymmetry assertion
6. G + H last — most testid surface area, least likely to regress silently
