# Plan: E2E tests for the Lighthouse app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Lighthouse is **read-only in the UI**: `app/apps/lighthouse/page.tsx` calls `getSites()` and renders `LighthouseApp`, which shows `SitesTable` + (on row-click) `ScoreHistory` (≥ 2 runs only) + `VitalsDetail`. There is no create/edit/delete affordance, no form, no row menu — audits are written into `public.lighthouse_audits` by an out-of-band ingest, not by the app. So there is no CRUD group in this plan; data-state coverage moves into "fixture seeding + selection".

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used
  - No second-user / pro-entitlement fixture is needed: registry says `tier: "free"` with `features: {}` and the layout only checks `requireAppLayoutAccess("lighthouse")` (permission `view`).
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "lighthouse", "view")` so the test user can reach `/apps/lighthouse`. Tear down after. Note `view` (not `edit`) — matches the registry's required permission, and there is no edit path to exercise.

## 2. Test data strategy (the work that doesn't exist yet)

The production schema is the denormalized `public.lighthouse_audits` table — one row per tracked site with the audit history stored as a JSONB array under `audits` (see `lib/queries.ts` and `supabase/migrations/20260429_lighthouse_audits.sql`). Tests must seed this exact shape, not the legacy `lighthouse_sites`/`lighthouse_runs` pair (those tables are dropped by the 04-29 migration).

Add `tests/e2e/helpers/lighthouse.ts` with service-role helpers:

- `seedSite(partial?: Partial<LighthouseAuditRow>): Promise<{ id: string }>` — inserts one row into `lighthouse_audits` with `audits: []` by default; lets the spec pick `id`, `site`, `url`.
- `seedSiteWithRuns(siteName, runs: AuditJson[]): Promise<{ id: string }>` — convenience wrapper that builds a site row whose `audits` JSONB contains the supplied audits (each `{ date, performance, accessibility, bestPractices, seo, details: { lcp, tbt, cls, fcp, si } }`).
- `getSiteById(id)` — DB-side assertion read.
- `deleteAllTestSites(prefix = "e2e-")` — cleanup; called in `afterEach` to keep tests independent. Filter by `site` name prefix because `lighthouse_audits` has no per-user FK (the table is global / RLS-readable to any authenticated user). The prefix convention prevents stomping on real audit rows in shared dev DBs.

Why DB-direct seeding (not UI): the app has no UI to create sites or runs — audits are produced by an external ingest. Seeding via the helper is the only way to set up state.

> **Schema caveat to encode in the helper:** `lighthouse_audits.id` is `text` (not `uuid`) and the column names use camelCase quoting (`"createdAt"`, `"updatedAt"`). The helper should generate ids like `e2e-<random>` so cleanup-by-prefix is reliable.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/lighthouse` redirects to login
2. Auth user without `lighthouse` permission → unauthorized page
3. Auth user with `lighthouse:view` permission → page renders with header "🏠 Lighthouse"
4. Subdomain route (`lighthouse.apps.lastrev.localhost` or rewritten) → resolves to the same page (covered indirectly by `subdomain-routing.spec.ts`; we add one Lighthouse-specific assertion to that file rather than duplicate the whole flow)

### Group B — Empty state

5. With no `lighthouse_audits` rows visible → `EmptyState` renders with title "No sites tracked" and the "📊" icon
6. With a row that has `audits: []` (site exists, never audited) → still renders the table but with em-dash placeholders in every score column and "—" in Last Run (guards the `run?.performance != null` ternaries in `sites-table.tsx`)

### Group C — Sites table render

7. Single site with one audit → table row shows site name, url (truncated/mono), four score badges, and a `runAt` date
8. Multiple sites → all rows present, sorted by `site` ascending (matches the `.order("site", { ascending: true })` in `getSites`)
9. Score badge variants — assert `data-variant` (or class fragment) per `scoreVariant()`:
   - perf 95 → "default" (good)
   - perf 70 → "secondary" (warn)
   - perf 30 → "destructive" (poor)
10. URL column is rendered with `truncate max-w-[200px]` — long URLs don't wrap (visual hint via `getBoundingClientRect().width` < 220)

### Group D — Selection & detail panes

11. Click a row → row gets `bg-amber-500/8` selected style, `<ScoreHistory>` and/or `<VitalsDetail>` mount below the table (depending on data shape — see D13/D14)
12. Click the same row again → selection toggles off, both detail panes unmount (asserts the `id === selectedSiteId ? null : id` toggle in `lighthouse-app.tsx`)
13. Site with **only one** audit selected → `<VitalsDetail>` renders ("Core Web Vitals — <name>"), `<ScoreHistory>` does **not** render (guards the `runs.length >= 2` branch in `lighthouse-app.tsx`)
14. Site with **two or more** audits selected → both `<ScoreHistory>` ("Score History — <name>") and `<VitalsDetail>` render
15. Click site A then site B → selection moves; B's detail panes replace A's (no leftover panes)

### Group E — Vitals & score thresholds

Each assertion seeds a single audit with one tuned metric and reads the rendered Badge text + variant in `<VitalsDetail>`. Thresholds come from `vitals-detail.tsx::vitalLevel()` — encode them once in the helper so the test stays in sync if web.dev tightens guidance:

16. `lcp` 2000ms → "Good"; 3000ms → "Needs Improvement"; 5000ms → "Poor"
17. `tbt` 100ms → "Good"; 400ms → "Needs Improvement"; 800ms → "Poor"
18. `cls` 0.05 → "Good"; 0.20 → "Needs Improvement"; 0.40 → "Poor"
19. `fcp` 1500ms → "Good"; 2500ms → "Needs Improvement"; 3500ms → "Poor"
20. `si` 2.4 → "Good" (rendered as `2.4s`); 4.5 → "Needs Improvement" (`4.5s`); 7.0 → "Poor" (`7.0s`) — covers the seconds-vs-ms format in `formatValue()`
21. Null metric → renders "—" and the badge is `secondary` (covers the `value == null` early-out branch)

### Group F — Score history chart

22. Seed a site with 5 audits spanning 5 dates → `<svg role="img" aria-label="Score history chart for <name>">` is present, has 4 `<path>` elements (one per category in `CATEGORIES`), and the gridline `<text>` labels read `0`, `25`, `50`, `75`, `100`
23. Seed a site with 6+ audits → date labels are sparse: first, last, and every ~5th index render a `<text>` (asserts the `i !== 0 && i !== runs.length - 1 && i % 5 !== 0` skip in `score-history.tsx`)
24. Seed audits with one category fully null (e.g. all `seo: null`) → that category's `<path>` has empty `d` attr (no points); other paths still draw — guards the `val == null` filter in `buildPath()`
25. Audits arrive out of order in JSONB → chart renders them in `runAt` ascending (asserts the `.sort((a, b) => (a.runAt ?? "").localeCompare(b.runAt ?? ""))` in `getSites`)

### Group G — A11y / regression

26. Score history chart has `role="img"` + descriptive `aria-label` (regression for screen-reader users)
27. Keyboard: Tab focuses the first table row; Enter triggers row selection (currently the row uses `onClick` only — this test will fail until a `role="button"` + key handler is added; capture as a known TODO so the spec drives the fix)
28. Empty-state text is reachable as a heading (`<EmptyState>` should expose its title as semantic, not a div) — guards copy regressions

## 4. Spec organization

```
apps/web/tests/e2e/lighthouse/
  access.spec.ts            # A
  empty-state.spec.ts       # B
  sites-table.spec.ts       # C
  selection.spec.ts         # D
  vitals.spec.ts            # E
  score-history.spec.ts     # F
  a11y.spec.ts              # G
```

Each file: `beforeAll` seeds permission + fixture data; `afterEach` calls `deleteAllTestSites("e2e-")` to keep tests independent; uses the shared `loggedInPage` fixture.

## 5. Selector strategy (do this before writing specs)

Currently the components rely on text + emoji + colored Tailwind classes. Add `data-testid` hooks to the high-traffic interactions in `lighthouse-app.tsx`, `sites-table.tsx`, `score-history.tsx`, `vitals-detail.tsx`:

- `lighthouse-page-header`
- `sites-table`, `sites-table-row-${siteId}`, `sites-table-empty`
- `score-cell-${category}` (where category ∈ `performance|accessibility|bestPractices|seo`) — emit `data-variant` so spec C9 can assert without reading classnames
- `score-history-chart` (already has `aria-label`; add testid for stable lookup)
- `score-history-path-${category}`
- `vitals-card-${metric}`, `vitals-badge-${metric}` (carry `data-level` so spec E16-21 reads `Good|Needs Improvement|Poor` without parsing badge text)
- `vitals-empty-dash` for the null-metric branch in spec E21

Small, surgical, and avoids querying by emoji/text.

## 6. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` already in `webServer.command` flow — `lighthouse` does not currently appear in `APP_SELF_ENROLL_SLUGS` (only `command-center,standup`), so we rely on `seedPermission` rather than self-enroll. If CI flake reveals that `seedPermission` races the page request, add `"lighthouse"` to the env override in `playwright.config.ts`.

## 7. Out of scope

- Component unit tests already exist in `apps/web/app/apps/lighthouse/__tests__/page.test.tsx` and `layout.test.tsx` — don't duplicate; e2e covers the auth → page-render → DB-state happy paths only
- Audit ingest pipeline (cron / external job that writes into `lighthouse_audits`) — that is not part of the Lighthouse mini-app's UI surface and would be exercised at the API layer
- Visual regression (screenshot diff of the SVG chart) — separate effort; the chart's structural assertions in F22-F25 cover the regression risk we care about today

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Add `tests/e2e/helpers/lighthouse.ts` — DB seed/cleanup against `lighthouse_audits` JSONB
3. Write `access.spec.ts` + `empty-state.spec.ts` + `sites-table.spec.ts` first (highest value, lowest flake risk)
4. Layer in D (selection) and E (vitals thresholds) — the data-driven groups
5. Score-history chart (F) and a11y (G) last — finer-grained DOM assertions are easier once the seed helper is proven
