# Plan: E2E tests for the Uptime app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

Scope note — Uptime is a **read-only status dashboard**. The app has no forms, no server actions, no API routes, no client-side mutations: `app/apps/uptime/page.tsx` does a single `supabase.from("sites").select("*")` and renders the result. Sites are populated by an external repo (`last-rev-llc/status-pulse`) — there is no in-app create/edit/delete. Therefore this plan has **no Group B (CRUD)** — fabricating CRUD specs would test features that don't exist. Coverage focuses on access/gating and the read-only render contract.

Second scope note — there is currently **no `sites` table in `supabase/migrations/`** (only `lighthouse_sites`, an unrelated app). The page's catch-error branch always fires in real environments today, so the empty-state path is the de-facto production behavior. Specs must seed the table directly in `beforeAll` (creating it if a future migration lands) rather than expect any UI to populate it.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used (service role required to seed `sites` rows since the app reads via SSR with the user session)
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. No second user is needed (no entitlement gating on this app — `tier: "free"`, `features: {}` in the registry).
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "uptime", "view")` so the test user can reach `/apps/uptime`. Tear down in `afterAll`. Note Uptime requires only `view` (registry: `permission: "view"`), so the existing `seedPermission` helper covers it without additions.
- **Self-enroll**: `uptime` is **not** in `playwright.config.ts`'s `APP_SELF_ENROLL_SLUGS`. Keep it that way — the unauthorized-redirect spec (Group A test 2) depends on self-enroll being closed so the user lands on `/unauthorized` rather than auto-enrolling. If a future change adds Uptime to self-enroll, that spec must be updated to assert the self-enroll button instead.

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/uptime.ts` with service-role helpers:

- `seedSite(partial?: Partial<SiteRow>): Promise<Site>` — inserts directly into `sites`, returns row. Required because the app has no UI to create sites.
- `seedSites(count, factoryFn?)` — bulk seed for multi-row render tests
- `listSites()` — reads back via service role for assertion that the rendered list matches the DB
- `deleteAllSites()` — cleanup; called in `afterEach` so each spec starts from a known state

Why DB-direct seeding (the only option): the app exposes no write surface. There is literally no other way to put a site on screen.

Open question for the implementer — the `sites` table does not yet exist in migrations. The helper can either (a) assume a future migration `<date>_sites.sql` lands first (preferred — file an issue and block the e2e PR on it), or (b) lazily `create table if not exists` inside the helper for ephemeral CI runs. Option (a) is cleaner and matches the append-only-migrations non-negotiable in `CLAUDE.md`. The schema must match the `Site` type in `app/apps/uptime/lib/types.ts` — `id`, `name`, `url`, `description`, `status` (`up`/`down`/`degraded`), `response_time_ms`, `uptime_percent`, `last_checked`, `history` (jsonb).

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/uptime` redirects to login
2. Auth user without `uptime` permission → `/unauthorized?app=uptime` (since uptime is not in `APP_SELF_ENROLL_SLUGS`, no self-enroll button shows — assert that distinction explicitly)
3. Auth user with `uptime:view` permission → page renders with header `📡 Uptime Status`
4. Permission hierarchy: user with `uptime:admin` can also load the page (registry minimum is `view`, higher tiers must satisfy)
5. Cross-app session: navigating from another granted app to `/apps/uptime` does not force re-login (regression for the multi-host Auth0 setup — the registry pin to `subdomain: "uptime"` exercises `getAuth0ClientForHost`)

### Group B — Status banner (read-only render)

6. Empty DB (zero rows) → green banner "✅ All Systems Operational" renders + the empty-state card "No sites are being monitored yet." both appear (the banner is unconditional on `issues.length === 0`, including when there are zero sites — this is intentional per `page.test.tsx`)
7. All seeded sites with `status='up'` → green banner, no "Experiencing Issues" text
8. One seeded site with `status='down'` + others `up` → red banner with text matching `/1 System Experiencing Issues/` (singular)
9. Two seeded sites with non-`up` status (mix of `down` and `degraded`) → red banner with `/2 Systems Experiencing Issues/` (plural — guards the `s` pluralization branch)
10. All sites `up` after a previous `down` was flipped via service-role update → banner re-renders green on next page load (validates `dynamic = "force-dynamic"` actually forces a fresh fetch — this matters because Next.js 16 cache-component defaults could otherwise stale this)

### Group C — Site cards (read-only render)

11. Card shows `name` and `url` for each seeded row
12. Status badge text — `up` → "Operational", `down` → "Down", `degraded` → "Degraded", unknown status → "Unknown" (covers the variant-fallback branch in `StatusBadge`)
13. Response time renders as `${ms}ms` when present, em-dash `—` when null/undefined
14. Uptime percent renders as `{n}%` when present, em-dash `—` when null
15. `description` renders below metrics when present, omitted when null (small-but-real conditional — guards a regression that could leak a div with no content)
16. Sites order alphabetical by `name` ascending (matches `.order("name", { ascending: true })` in the loader — guards against accidental re-order on refactor)

### Group D — UptimeBars history chart

17. Site with 30 days of `history` → 30 bar elements render with `[title]` attributes formatted `"{date}: {status}"` (or `"{date}: {status} ({ms}ms)"` when responseTimeMs present)
18. Bars render reversed from input (oldest first visually) — assert by reading `[title]` order and comparing to seeded data reversed
19. Bar color classes — `up` → contains `bg-green`, `down` → `bg-red`, `degraded` → `bg-yellow` (the only hardcoded color paths in this component; if `audit:tokens` ever forces theme tokens, this spec catches the visual regression)
20. Site with empty `history: []` → no bar container renders, but card body still shows (UptimeBars returns null for empty)
21. History date labels — first/last date shown under bars match the bounds of the seeded history array

### Group E — Empty / error states

22. Zero sites in DB → empty-state card with copy "No sites are being monitored yet." and the `status-pulse` external link with `target="_blank"` and `rel="noopener noreferrer"` (the `noreferrer` is a security invariant — guard it explicitly)
23. Supabase select returns an error (simulate by revoking RLS or seeding a row with invalid status) → page falls through to `data ?? []` and renders the empty state without throwing (the `console.error` path in `getSites`)
24. Footer link to `last-rev-llc/status-pulse` always renders (present in both empty and populated states)

### Group F — Layout & a11y

25. `Topbar` renders `📡 Uptime Status` title (guards the layout-level metadata)
26. "← Dashboard" back link routes to `/` (cross-app nav — important since Uptime sits at a subdomain and the link must respect host)
27. Keyboard: Tab order through the page reaches the back link, the external `status-pulse` links, and exits without trapping focus

## 4. Spec organization

```
apps/web/tests/e2e/uptime/
  access.spec.ts           # A — gating, hierarchy, cross-app session
  banner.spec.ts           # B — All Systems / Experiencing Issues states
  cards.spec.ts            # C — name/url/status/metrics/description rendering
  history.spec.ts          # D — UptimeBars title attrs, color classes, ordering
  empty-error.spec.ts      # E — empty state + error fallback + footer link
  layout.spec.ts           # F — Topbar, back link, keyboard a11y
```

Each file: `beforeAll` seeds permission; `afterEach` clears `sites` rows; `afterAll` removes the permission. Uses the shared `loggedInPage` fixture except `access.spec.ts` test 1 which uses `unauthPage`.

## 5. Selector strategy (do this before writing specs)

The current page.tsx has zero `data-testid` hooks — every assertion would have to query by emoji or copy text, which is fragile. Add surgical hooks before writing specs:

- `uptime-banner` (root of the green/red banner div) + `data-state="operational" | "issues"` attribute so banner-state assertions don't depend on emoji
- `site-card` on each `Card`, `site-card-name`, `site-card-url`, `site-card-description`, `site-card-response-time`, `site-card-uptime-percent`
- `status-badge` + `data-status="up|down|degraded|unknown"` so we don't grep label text
- `uptime-bars` on the bars container; individual bars already get a `[title]` attribute — keep that as the primary assertion target since the test for it already works in the unit tests
- `empty-state` on the empty-state card, `empty-state-link` on the `status-pulse` anchor
- `footer-link` on the bottom `status-pulse` anchor

Why: copy-text queries break the moment a designer reorders the banner string, and emoji queries are unreadable in failure output. Test IDs are stable, scoped, and cheap.

## 6. Running

- `pnpm --filter web test:e2e` — Playwright runs against `pnpm dev` (or `next start` in CI per the existing webServer config).
- Local: dev server is reused (`reuseExistingServer: !CI`).
- CI: `APP_SELF_ENROLL_SLUGS` should remain `command-center,standup` only — see Setup §1; do NOT add `uptime` since spec A2 asserts the unauthorized path.

## 7. Out of scope

- Unit-level rendering coverage — `app/apps/uptime/__tests__/page.test.tsx` and `layout.test.tsx` already exist and exhaustively cover the render branches with mocked Supabase. E2E only validates the real `requireAppLayoutAccess` → Supabase round-trip, not the component logic.
- Site monitoring / scheduled-check behavior — owned by the external `status-pulse` repo, not this app.
- CRUD specs — there is no UI for creating, editing, or deleting sites. Adding "create flow" tests would test imaginary features.
- Visual regression — separate effort.

---

## Execution order

1. Land the missing `<date>_sites.sql` migration first (blocker — the helper has nothing to insert into otherwise). Open as a separate, small PR.
2. Add `data-testid` hooks to `page.tsx` and `layout.tsx` (§5) — small PR, no behavior change.
3. Add `tests/e2e/helpers/uptime.ts` — DB seed/cleanup.
4. Write `access.spec.ts` + `banner.spec.ts` first (highest value, lowest flake risk — banner state is the headline UX).
5. Layer in `cards.spec.ts` and `history.spec.ts`.
6. Empty/error and layout specs last (lowest churn, longest tail value).
