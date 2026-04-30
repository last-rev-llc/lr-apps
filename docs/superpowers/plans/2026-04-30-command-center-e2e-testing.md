# Plan: E2E tests for the Command Center app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Command Center is a `template: "full"`, `tier: "enterprise"`, `auth: true` app
that acts as a *hub* over ~22 sub-modules (`/apps/command-center/<module>`).
The hub page and most sub-modules are read-only dashboards backed by
Supabase queries (`agents`, `leads`, `recipes`, `contacts`, `crons`, `media`,
`prs`, `client_health`, `concerts`, `team_usf`, `uptime_sites`, `scripts`,
`zoom_transcripts`, `contentful_health`, etc.). Two sub-modules are
admin-only and are the only places with real write paths or external
service dependencies:

- `cc-flags` — admin-only CRUD over `feature_flags` (server actions:
  `setGlobalFlag`, `setTierDefault`, `addUserOverride`, `removeOverride`).
- `cc-analytics` — admin-only read of PostHog events.
- `app-access` — list of `app_permissions` rows (read-only in the UI).

Existing infra is solid — Playwright is configured at
`apps/web/playwright.config.ts` (which already includes `command-center` in
`APP_SELF_ENROLL_SLUGS` for CI), there's an Auth0 `loggedInPage` fixture
(`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a
Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding
permissions. We extend, not replace. Vitest unit tests in
`app/apps/command-center/__tests__/` already cover module-page rendering
in isolation — e2e covers integration: gating → layout → module navigation
→ admin write paths → tier upgrade flow.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture (this is the *enterprise-tier* user; needed for module access)
  - `E2E_TEST_USER_ADMIN_EMAIL/PASSWORD/ID` — second user with `command-center:admin` permission for `cc-flags` and `cc-analytics` specs
  - `E2E_TEST_USER_FREE_EMAIL/PASSWORD/ID` — third user on the *free* tier to exercise the enterprise upgrade gate (Group A)
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used
- **No new fixtures needed**: reuse `loggedInPage` from `auth.fixture.ts`. Specs that exercise the admin or upgrade-gate flow get a second context loaded with a different `storageState` file (e.g. `tests/e2e/.auth/admin.json`, `tests/e2e/.auth/free.json` produced by extending `global-setup.ts` to log in each role once).
- **Permissions**: `beforeAll` calls `seedPermission(userId, "command-center", "view")` for the standard user, `"admin"` for the admin user. The free-tier user gets *no* permission row — we want to assert the `requireAccess` redirect happens before the tier check, OR seed `view` to assert the layout-level `enforceFeatureTier` upgrade gate fires (see §3 Group A).
- **Tier gating**: the layout calls `enforceFeatureTier(user.id, "command-center")`, which only enforces when the global feature flag `tier_enforcement_enabled` is `true`. To test the upgrade flow deterministically, the upgrade-gate spec flips that flag to `true` for the free-tier user via the service-role client in `beforeAll`, then back to `false` in `afterAll`. Without that flip, the gate is a no-op in dev/CI.

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/command-center.ts` with service-role helpers:

- `setTierEnforcement(enabled: boolean): Promise<void>` — upserts the global `tier_enforcement_enabled` row in `feature_flags`. Used by Group A to flip enforcement on for the upgrade-gate test, then off again.
- `seedFeatureFlag(key, { tier?, userId?, enabled }): Promise<{ id }>` — seeds a `feature_flags` row for `cc-flags` admin tests so we have a known starting state to edit/delete.
- `listFeatureFlags(key): Promise<FlagRow[]>` — DB read for asserting that admin server actions actually persisted.
- `deleteFeatureFlagsByKey(keys: string[]): Promise<void>` — cleanup. Scoped by key prefix (e.g. `e2e_*`) so we never touch real flags like `tier_enforcement_enabled` accidentally.
- `seedAppPermission(userId, slug, permission)` — already exists in `helpers/db.ts` as `seedPermission`. Reused, not re-implemented.

DB-direct seeding (not UI) for `feature_flags` because the `cc-flags` UI is the *thing under test* — pre-seeding via SQL gives us a stable starting state without circular dependence on the UI we're verifying.

For the read-only modules (`agents`, `leads`, `recipes`, `users`, `crons`, `gallery`, `client-health`, `concerts`, `meeting-summaries`, `pr-review`, `team-usf`, etc.) we deliberately **do not seed** their tables. Many of those tables are populated by external pipelines (cron jobs, Zoom transcripts, GitHub PR sync, Contentful health checks) and aren't owned by this app. Instead, smoke specs assert "page renders without crashing, header testid present, empty state OR rows render" — we test the UI shell, not specific data. This keeps the suite stable across environments where those tables may be empty.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke + tier upgrade)

1. Unauth user → `/apps/command-center` redirects to login
2. Auth user without `command-center` permission → unauthorized page (self-enroll allowed in dev/CI via `APP_SELF_ENROLL_SLUGS`, so this asserts the *production* path by toggling the env or asserting the self-enroll happy path — see test 3)
3. Auth user with self-enroll allowed → first visit lands on the hub, header `⚡ Command Center` rendered, sidebar shows all modules
4. Auth user with `command-center:view` permission → hub renders, all module sidebar links present
5. Free-tier user with `tier_enforcement_enabled=true` → `/apps/command-center` renders the `UpgradePrompt` (`🔒 Enterprise Plan Required`, "View Pricing" link to `/pricing`)
6. Enterprise-tier user with enforcement on → no upgrade prompt, hub renders normally
7. Standard user (no `admin` permission) → visits `/apps/command-center/cc-flags` → unauthorized (server-side `requireAccess("command-center", "admin")` in the page)
8. Standard user → visits `/apps/command-center/cc-analytics` → unauthorized (same admin gate)
9. Admin user → both `cc-flags` and `cc-analytics` render without redirect

### Group B — Hub navigation (smoke)

10. Hub page renders quick-stat cards: `Modules`, `Routes`, `Categories`, `Status` with non-zero values
11. Hub renders one card per registered module (count matches the `MODULES` array in `page.tsx`)
12. Clicking a module card navigates to `/apps/command-center/<slug>` and the sidebar highlights the active module — assert URL change and module page header rendered
13. Sidebar `← Dashboard` link returns to `/`
14. Sidebar `⚡ Hub` link returns to `/apps/command-center` from any sub-module

### Group C — Read-only module smoke

These are intentionally shallow — one test per module asserting "page loads, header present, no console error, either rows or `EmptyState` rendered." We are *not* testing module-internal filters/search/sort because (a) those are covered by Vitest in `__tests__/`, and (b) data shape varies per environment.

15. `agents` page loads, header `🤖 Agents` testid `module-header` visible
16. `leads` page loads, header `🎯 Leads`
17. `recipes` page loads, header `📋 Recipes`
18. `users` page loads, header `👥 Users`
19. `crons` page loads, header `⏰ Crons`
20. `gallery` page loads, header `🖼️ Gallery`
21. `client-health` page loads, header `💚 Client Health`
22. `concerts` page loads, header `🎵 Concerts`
23. `meeting-summaries` page loads, header `📝 Meeting Summaries`
24. `pr-review` page loads, header `🔍 PR Review`
25. `team-usf` page loads, header `🏫 Team USF`
26. `app-access` page loads, header `🔐 App Access`, at least one permission row (the test user's seeded `command-center` perm) is present
27. `architecture`, `iron`, `contentful`, `meme-generator`, `rizz-guide`, `shopping-list`, `ai-scripts`, `alphaclaw` — single parameterised test (loop) asserting each route returns 200 and renders its header. One Playwright test, N module slugs, fast.

### Group D — Feature flags admin (CRUD — the only real write path)

Seeded via `seedFeatureFlag` with key prefix `e2e_<timestamp>_*` so the cleanup helper can wipe them deterministically.

28. Non-admin → toggling a flag is impossible because the page redirects (covered in A8); this group runs as the admin user only
29. `setGlobalFlag`: toggle a global default → row upserted with `user_id=null, tier=null`, UI reflects the new state, DB row matches
30. `setGlobalFlag` again to toggle off → row's `enabled` flips, no duplicate inserted
31. `setTierDefault`: enable a flag for `pro` tier → row upserted with `tier='pro', user_id=null`, UI shows the per-tier indicator
32. `setTierDefault`: enable for `enterprise` independently of `pro` → both rows present, neither overwritten
33. `addUserOverride`: enter a known email → row upserted with that user's `user_id`, UI lists the override
34. `addUserOverride` with unknown email → server action returns `{ ok: false, error: "user not found" }`, UI surfaces the error inline
35. `addUserOverride` with malformed email → Zod validation error shown, no DB row
36. `removeOverride`: click delete on a seeded override row → DB row gone, UI list shrinks

### Group E — Analytics (read-only, admin)

37. Admin loads `cc-analytics` → page renders three sections (event totals by slug, recent events list, top events chart) with their testid containers present
38. If PostHog returns an error (mock `posthog-client` to reject), the page still renders without crashing — error surface visible (regression guard for the `Promise.all` happy path)

### Group F — A11y / regression

39. Sidebar nav: keyboard tab order walks Hub → each module link in DOM order; Enter activates the link
40. Hub topbar: `⚡ Command Center` link returns to `/apps/command-center` from any sub-module URL (matches B14 but exercised via keyboard)

## 4. Spec organization

```
apps/web/tests/e2e/command-center/
  access.spec.ts            # A (unauth, no-perm, admin gate, tier upgrade)
  hub-nav.spec.ts           # B (hub page + sidebar + topbar)
  modules-smoke.spec.ts     # C (15-27, parameterised over module slugs)
  flags-admin.spec.ts       # D (cc-flags CRUD, admin user only)
  analytics.spec.ts         # E (cc-analytics, admin user only)
  a11y.spec.ts              # F
```

Each file: `beforeAll` seeds permissions (and tier-enforcement flag where relevant); `afterAll` clears `e2e_*`-prefixed feature flag rows and deletes seeded permissions for non-default users; uses the shared `loggedInPage` fixture (or an admin-context variant for `flags-admin.spec.ts` / `analytics.spec.ts`).

## 5. Selector strategy (do this before writing specs)

The hub and sub-modules currently rely on text + emoji + Tailwind classes. To keep tests stable as copy/icons change, add `data-testid` hooks to the high-traffic surfaces. Surgical, not exhaustive:

- **Layout** (`app/apps/command-center/layout.tsx`):
  - `cc-topbar`, `cc-topbar-home` (`⚡ Command Center` link)
  - `cc-sidebar`, `cc-sidebar-hub`, `cc-sidebar-link-${slug}` (one per module)
- **Hub page** (`page.tsx`):
  - `cc-hub-stat-${modules|routes|categories|status}`
  - `cc-hub-card-${slug}` on each module card
- **Module pages** (every `components/<module>-app.tsx`):
  - `module-header` on the `PageHeader` element so smoke tests have one stable assertion target per module
- **`cc-flags`** (`components/flags-app.tsx`):
  - `flag-row-${key}`, `flag-global-toggle-${key}`, `flag-tier-toggle-${key}-${tier}`
  - `flag-add-override-${key}`, `flag-override-email-input`, `flag-override-submit`
  - `flag-override-row-${id}`, `flag-override-remove-${id}`
  - `flag-error` for inline action errors (user-not-found, validation)
- **`cc-analytics`** (`components/analytics-app.tsx`):
  - `analytics-totals`, `analytics-recent-events`, `analytics-top-events`
- **`UpgradePrompt`** (`components/UpgradePrompt.tsx`):
  - `upgrade-prompt`, `upgrade-prompt-cta` (`/pricing` link)

Avoid querying by emoji/text — Tailwind class purges and copy edits routinely break those.

## 6. Running

- `pnpm --filter web test:e2e` (script already wired to `playwright test`)
- Local: dev server is reused (`reuseExistingServer: !CI`); `APP_SELF_ENROLL_SLUGS` already includes `command-center` in `playwright.config.ts` `webServer.env`
- CI: `next build && next start` flow inherits the same env. `tier_enforcement_enabled` defaults to `false`, so Group A test 5 must explicitly flip it on in `beforeAll` and off in `afterAll` to avoid leaking state into other suites.
- Admin/free users: `global-setup.ts` should be extended to do an Auth0 login for each role and persist three `storageState` files (`user.json`, `admin.json`, `free.json`). Specs pick the right one via a context-factory helper.

## 7. Out of scope

- Module-internal filtering/sorting/search behaviour — Vitest already covers each module's component logic in `app/apps/command-center/<module>/__tests__/` (and `__tests__/<module>.test.tsx`). E2e covers the integration shell only.
- External-data correctness (PostHog event content, GitHub PR sync, Zoom transcripts, Contentful health probes) — those pipelines have their own checks; we test the rendering shell.
- Visual regression (screenshot diff) — separate effort.
- `cc-flags` server-action edge cases that already have unit coverage in `cc-flags/__tests__/` — e2e exercises the happy paths plus the user-not-found UX surface (D34).

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behaviour change, unblocks every spec
2. Add `tests/e2e/helpers/command-center.ts` (`setTierEnforcement`, `seedFeatureFlag`, `listFeatureFlags`, `deleteFeatureFlagsByKey`)
3. Extend `global-setup.ts` to produce admin/free `storageState` files (depends on the new env vars)
4. Write `access.spec.ts` + `hub-nav.spec.ts` first (highest value, exercises layout/registry/tier-gate plumbing)
5. Layer in `modules-smoke.spec.ts` (parameterised — fast and broad)
6. Write `flags-admin.spec.ts` (only group with real DB writes)
7. Add `analytics.spec.ts` and `a11y.spec.ts` last
