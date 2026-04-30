# Plan: E2E tests for the Sentiment app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Sentiment is **read-only** in this iteration: a Server-Component dashboard fed by `getSentimentEntries()` (Supabase `sentiment_entries` table), wrapped in a Client Component (`SentimentDashboard`) that owns interactive filtering. There's no UI to create/edit/delete entries — so this plan deliberately skips a CRUD group. The app is `template: "full"` (layout + dashboard + about/docs/changelog), `tier: "pro"` (gated via `enforceFeatureTier` → `UpgradePrompt`), and `auth: true, permission: "view"`.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture (free-tier user by default; gets the upgrade gate)
  - `E2E_TEST_USER_PRO_EMAIL/PASSWORD/ID` — second user with an active `pro` subscription so we can exercise the gated dashboard. Why: the layout calls `enforceFeatureTier(user.id, "sentiment")` and shows `<UpgradePrompt requiredTier="pro" />` when the user lacks the `sentiment` feature (mapped to tier `pro` in `packages/billing/src/has-feature-access.ts`). Without a paid user we can never reach the dashboard at all.
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`; the upgrade-gate spec uses the default (free) user, the dashboard specs use a second context loaded with the pro user's `storageState` file.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "sentiment", "view")` so the test user can reach `/apps/sentiment` (the registry entry requires `permission: "view"`). Tear down after.
- **Tier enforcement flag**: the gate only fires when the `tier_enforcement_enabled` feature flag is `true` for the user (see `apps/web/lib/enforce-feature-tier.ts`). The plan's helper turns this on for both test users in `beforeAll` and clears it in `afterAll`, so the gate behavior is deterministic instead of depending on global flag state.

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/sentiment.ts` with service-role helpers. Sentiment is read-only from the user's perspective, but tests still need to insert/clean a known dataset out-of-band:

- `seedSentimentEntry(partial?: Partial<SentimentEntry>): Promise<SentimentEntry>` — inserts one row directly, returns it
- `seedSentimentEntries(rows: Array<Partial<SentimentEntry>>): Promise<SentimentEntry[]>` — bulk
- `deleteSentimentEntriesByPrefix(prefix: string): Promise<void>` — cleanup; called in `afterEach`. We tag every test row's `id` with a random prefix (e.g. `e2e-${runId}-1`) so we can purge without touching the production-seeded 65 entries the dashboard demos against.

Add `tests/e2e/helpers/billing.ts` with:

- `seedProSubscription(userId): Promise<void>` — upserts an `active`/`pro` row in `subscriptions` so `hasFeatureAccess(userId, "sentiment")` resolves true
- `clearSubscription(userId): Promise<void>` — cleanup
- `setTierEnforcement(userId, on: boolean)` — toggles the `tier_enforcement_enabled` flag for the user

Why DB-direct: there's no UI path to create sentiment entries or to upgrade a subscription in this app, so seeding through the UI is impossible. Service-role inserts are the only option.

Why a prefixed-id cleanup (not a delete-all): the table is shared with manually-curated demo data (65 rows from Phase 3); a blanket truncate would wipe it.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/sentiment` redirects to login
2. Auth user without `sentiment` permission → `/unauthorized?app=sentiment`
3. Auth user with `sentiment:view` permission BUT free tier (and `tier_enforcement_enabled=true`) → `<UpgradePrompt requiredTier="pro" />` renders ("Pro Plan Required" copy + "View Pricing" link to `/pricing`)
4. Auth user with `sentiment:view` permission AND `pro` subscription → dashboard renders with header "Sentiment" and the "Dashboard" / "About" / "Docs" / "Changelog" nav
5. Auth user with `sentiment:view` permission AND `tier_enforcement_enabled=false` → dashboard renders even on free tier (regression guard for the staged-rollout escape hatch in `enforceFeatureTier`)
6. Pro user without `sentiment:view` permission → still `/unauthorized` (permission check runs before tier check via `requireAccess`)

### Group B — Dashboard render & data flow (read-only)

> No CRUD; the user-visible value is "the right numbers and the right cards from the right rows". Each test seeds a deterministic mini-dataset and asserts what's painted.

7. With 0 seeded entries (empty state) → StatsRow shows `—` for Avg Sentiment and `0` for Total/Members/Blocked/Highlights; SentimentChart returns null (no chart card); Timeline + MemberGrid render empty containers without crashing
8. With a 5-entry, 2-member dataset → StatsRow values match expected (`avgSentiment` = mean to one decimal, `totalEntries` = 5, `uniqueMembers` = 2, `blockedDays` = count of `mood === "blocked"`, `highlights` = sum of `highlights[].length`)
9. SentimentChart "all members" mode renders one `<line>` per member (assert via `data-testid="chart-line-${member}"`); legend shows each member name
10. MemberGrid renders one card per unique member, in alphabetical order, each showing latestMood badge + latestScore/10 + avg + entry count
11. Timeline groups entries by date in descending order; highlights/blockers render as pills only when arrays are non-empty (regression: covers `entry.highlights?.length > 0` falsy guard)

### Group C — Member filter (client-side interactivity)

12. Default filter value = "All Members"; chart is multi-line, MemberGrid shows all members
13. Select a specific member → StatsRow recomputes (e.g. "Alice has 2 entries, scores 9+7, avg 8.0"); SentimentChart switches to single-line mode with header "Sentiment Trend — Alice"; MemberGrid narrows to one card; Timeline shows only that member's entries
14. Switch back to "All Members" → all sections restore without a page reload (proves it's purely client-side `useMemo` re-derivation, not a server round-trip)
15. Filter dropdown lists `All Members` + one option per unique `member_name` in the dataset, sorted

### Group D — Mood badges & visual states

16. Each of the five known moods (`positive`, `neutral`, `frustrated`, `blocked`, `excited`) seeded once → MoodBadge for each renders with the documented color class (e.g. `blocked` → `bg-red/20`, `excited` → `bg-pill-0/20`). Why: the badge's color mapping is the only place the design tokens are tied to user-visible mood semantics; a Tailwind purge regression would silently downgrade all badges to neutral.
17. Unknown mood string (seed `mood: "panicked"` directly) → falls back to neutral style without crashing the page

### Group E — Multi-page navigation (`template: "full"`)

18. Click "About" link → navigates to `/apps/sentiment/about`, page renders feature grid heading "Track Team Sentiment in Real-Time"
19. Click "Docs" → `/apps/sentiment/docs` renders, scoring-guide list visible
20. Click "Changelog" → `/apps/sentiment/changelog` renders, lists v3.0.0 / v2.0.0 / v1.0.0
21. Header nav links remain on every sub-page (regression guard for layout consistency)
22. About/Docs/Changelog ALSO require `sentiment:view` + tier (they live under the same `layout.tsx`) — free user hitting `/apps/sentiment/docs` directly gets the same `UpgradePrompt`. Why: easy to accidentally exempt static pages from the gate when refactoring; the layout currently catches all of them, and we want a test that fails if someone moves the check into `page.tsx`.

### Group F — Loading & error states

23. Slow Supabase response (route-intercept the `sentiment_entries` query with a 2s delay) → `loading.tsx` skeleton renders (heading skeleton, 5 stat-card skeletons, chart skeleton)
24. Error path: route-intercept the query to return a 500 → `error.tsx` renders "Something went wrong" with a "Try again" button. Click → reset is invoked (verify by intercepting and returning success the second time)

### Group G — Capture analytics

25. Successful dashboard load → `capture(user.id, "app_opened", { slug: "sentiment" })` fires once. Assert by intercepting the analytics endpoint OR by reading from a service-role client that the matching analytics row was written. Why: layout-level `capture` is wired in `layout.tsx:15`, easy to drop in a refactor, and product cares about "did the pilot user actually open the app".

## 4. Spec organization

```
apps/web/tests/e2e/sentiment/
  access.spec.ts            # A — auth + permission + tier gate
  dashboard-render.spec.ts  # B — stats/chart/grid/timeline derived correctly
  filter.spec.ts            # C — client-side member filter
  mood-badges.spec.ts       # D — color tokens + unknown-mood fallback
  navigation.spec.ts        # E — about/docs/changelog under same gate
  loading-error.spec.ts     # F — loading skeleton + error boundary
  analytics.spec.ts         # G — capture("app_opened") fires
```

Each file: `beforeAll` seeds permission + (where needed) pro subscription + tier-flag, plus the dataset; `afterEach` purges only the prefixed seed rows; `afterAll` clears subscription + flag + permission.

## 5. Selector strategy (do this before writing specs)

Sentiment's components currently rely on text + a couple of native elements (`<select role="combobox">` from `member-filter.tsx`). To keep tests stable as copy/styles change, add `data-testid` hooks to the high-traffic surfaces in `sentiment-dashboard.tsx`, `sentiment-chart.tsx`, `member-filter.tsx`, `member-grid.tsx`, `timeline.tsx`, `stats-row.tsx`, `mood-badge.tsx`:

- `sentiment-dashboard`, `sentiment-chart-card`, `sentiment-chart-line-${memberOrScore}`
- `member-filter`, `member-filter-option-${value}` (or rely on native `<select>` + `selectOption`)
- `stat-card-${avgSentiment|totalEntries|teamMembers|blockedDays|highlights}` and `stat-card-value` / `stat-card-label`
- `member-card-${name}`, `member-card-latest-mood`, `member-card-latest-score`
- `timeline-day-${date}`, `timeline-entry-${id}`, `timeline-entry-highlights`, `timeline-entry-blockers`
- `mood-badge` (with `data-mood="${mood}"` so the test can assert the class without coupling to text)
- `nav-${dashboard|about|docs|changelog}` on the layout header anchors
- `upgrade-prompt`, `upgrade-prompt-cta` on `UpgradePrompt.tsx` (shared component — benefits other tier-gated apps too)

Small, surgical, and avoids querying by emoji/text.

## 6. Running

- `pnpm --filter web test:e2e` (script already exists per `auth.spec.ts` precedent) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` already in `webServer.command` flow — note `APP_SELF_ENROLL_SLUGS` is **not** extended to include `sentiment`; this app is intentionally permission-only (no self-enroll), so we always go through `seedPermission` in `beforeAll`. Adding it to the env would silently mask permission-denial tests in Group A.

## 7. Out of scope

- Component unit tests already exist in `apps/web/app/apps/sentiment/__tests__/` (`page.test.tsx`, `sentiment-dashboard.test.tsx`, `layout.test.tsx`, `error.test.tsx`, `changelog.test.tsx`, `docs.test.tsx`) — don't duplicate the StatsRow math or MemberFilter wiring assertions; e2e covers the requireAccess → tier-check → render → click → re-derive happy paths only
- CRUD: no write surface exists. If a "log today's sentiment" form lands later (referenced in Phase 3 as a deferred admin page), this plan gets a Group B-prime
- Recharts SVG visual regression — separate effort; we assert structure (line count, legend entries) not pixels
- Auth0 self-enroll flow for `sentiment` — by design not enabled; covered by `auth.spec.ts` against other apps
- Subdomain routing (`sentiment.lastrev.com` → `/apps/sentiment`) — covered by `subdomain-routing.spec.ts`; we test the route-group path directly

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Add `tests/e2e/helpers/sentiment.ts` + `tests/e2e/helpers/billing.ts` — DB seed/cleanup + subscription/flag helpers
3. Write `access.spec.ts` first — exercises every auth/permission/tier branch and shakes out the helper API before fan-out
4. Write `dashboard-render.spec.ts` + `filter.spec.ts` — highest user-value flows
5. Layer in D/E/F
6. Analytics last (most likely to flake on intercept timing; isolate so it can be quarantined without blocking the rest)
