# Alpha Loop Milestones Design — lr-apps

**Date:** 2026-04-07
**Goal:** Define milestones and issues for Alpha Loop to autonomously improve lr-apps across three focus areas: quality baseline, design consistency, and auth/access.
**Total:** 7 milestones, ~85 issues

---

## Context

lr-apps is a pnpm/Turbo monorepo with 27 apps under `apps/web/app/apps/`, 5 shared packages (`auth`, `db`, `ui`, `theme`, `config`), and a subdomain-based routing system (`*.apps.lastrev.com`).

### Current State

- **Auth:** 14 of 27 apps are auth-gated. 13 are fully public. All apps will become gated.
- **UI adoption:** Only 4 of 27 apps use `@repo/ui`. The other 23 use inline Tailwind.
- **Theme:** Comprehensive token system (60+ CSS vars) in `@repo/theme`, but most apps hardcode values.
- **Tests:** Zero test files across the entire suite.
- **Billing:** No Stripe integration exists. Scaffold only — runtime gating comes later.

### Decisions

- All apps require login (universal auth gate).
- Stripe integration is infrastructure-only for now (`@repo/billing` package, no app-level paywalls).
- Each functional issue includes smoke tests. A dedicated milestone adds deeper coverage.
- Design consistency: enforce theme tokens first, then migrate to `@repo/ui` components.
- Shared/cross-cutting work lands first, then app-specific work ordered by completeness.

---

## M1: Shared Foundations

**Goal:** Establish infrastructure that all subsequent milestones depend on.

### Issues

#### 1. Create `@repo/billing` package
- Stripe customer creation and subscription management helpers
- Webhook handler at `/api/webhooks/stripe`
- `hasFeatureAccess(userId, feature)` server utility
- New `subscriptions` table via `@repo/db`
- No app-level gating — plumbing only
- **Priority:** p1 | **Complexity:** large

#### 2. Add Vitest workspace config + shared test utilities
- Configure Vitest at monorepo root with workspace support
- Create `packages/test-utils` with helpers:
  - Mock Supabase client
  - Mock Auth0 session
  - `renderWithProviders()` wrapper
- Add `test` script to every package
- **Priority:** p1 | **Complexity:** medium

#### 3. Expand `@repo/db` with typed query helpers
- `getAppPermission(userId, slug)` — replaces raw `.from("app_permissions").select()` chains
- `getUserSubscription(userId)` — for billing package consumption
- `upsertPermission()` — for self-enroll and admin flows
- Typed return types for all helpers
- **Priority:** p1 | **Complexity:** medium

#### 4. Update auth middleware for universal gate
- Update `requireAppLayoutAccess()` to gate ALL apps by default (remove `publicEntry` bypass)
- Add `publicRoutes` escape hatch for specific paths (webhooks, marketing pages)
- Ensure redirect-after-login works for all 27 apps
- **Priority:** p0 | **Complexity:** medium

#### 5. Extend app registry with billing metadata
- Add `tier: "free" | "pro" | "enterprise"` to `AppConfig`
- Add `features: Record<string, Tier>` field
- No runtime enforcement — schema only
- Update all 27 registry entries with default `tier: "free"`
- **Priority:** p2 | **Complexity:** small

---

## M2: Universal Auth Gate

**Goal:** Every app requires login. Mechanical rollout leveraging M1's middleware changes.

### Per-App Issues (13 total)

Each issue follows this pattern:
- Update `layout.tsx` to call `requireAppLayoutAccess("slug")`
- Update app registry entry: set `auth: true`
- Add test: unauthenticated request redirects to `/login`
- Add test: authenticated user without permission redirects to `/unauthorized`
- **Priority:** p1 | **Complexity:** small

**Apps:**

1. Age of Apes
2. Alpha Wins
3. Area 52
4. Brommie Quake
5. Cringe Rizzler
6. Dad Joke of the Day
7. HSPT Practice
8. HSPT Tutor
9. Lighthouse
10. Proper Wine Pour
11. Roblox Dances
12. Soccer Training
13. Superstars

### Cross-Cutting Issue

#### 14. Update login/signup flows for universal auth
- Ensure redirect-after-login works for all 27 apps
- Update unauthorized page to show app name and "request access" CTA
- Add self-enroll support for apps that auto-grant `view` on first login
- Update `APP_SELF_ENROLL_SLUGS` env var
- **Priority:** p1 | **Complexity:** medium

**Note:** 14 apps already call `requireAppLayoutAccess()` in their layouts (Command Center, Accounts, AI Calculator, Daily Updates, Generations, Meeting Summaries, Sentiment, Slang Translator, Sprint Planning, Standup, Summaries, Travel Collection, Uptime, Sales). These only need their registry entry updated to `auth: true` — no layout changes. The 13 issues above cover the apps that need both layout and registry changes.

---

## M3: Theme Token Audit

**Goal:** Every app uses shared design tokens consistently. No hardcoded hex, shadows, font stacks. Prerequisite for component migration.

### Issues

#### 1. Audit and document token usage violations
- Scan all 27 apps for hardcoded colors (hex, rgb, oklch), shadows, border-radius, font-family
- Output per-app report of violations
- Produces the checklist driving the rest of M3
- **Priority:** p1 | **Complexity:** small

#### 2. Replace hardcoded tokens — batch 1 (internal apps)
- Command Center, Accounts, Standup, Sprint Planning, Summaries, Daily Updates, Sentiment, Meeting Summaries, Uptime, Sales
- Replace inline color values with Tailwind theme token classes
- Add snapshot/visual regression baseline per app
- **Priority:** p1 | **Complexity:** medium

#### 3. Replace hardcoded tokens — batch 2 (consumer apps)
- Dad Joke, Cringe Rizzler, Generations, Slang Translator, HSPT Practice, HSPT Tutor, Proper Wine Pour, Roblox Dances, Soccer Training, Age of Apes
- Same pattern as batch 1
- **Priority:** p1 | **Complexity:** medium

#### 4. Replace hardcoded tokens — batch 3 (showcase apps)
- Alpha Wins, Brommie Quake, Superstars, Travel Collection, AI Calculator, Area 52, Lighthouse
- Same pattern as batch 1
- **Priority:** p2 | **Complexity:** medium

#### 5. Standardize glass/shadow/animation usage
- Replace inline glass effects with `glass`, `glass-sm`, `glass-strong` utilities
- Replace inline shadows with theme shadow tokens
- Replace inline animations with `animate-fade-in-up`, `animate-scale-in` utilities
- **Priority:** p2 | **Complexity:** small

#### 6. Add theme token lint rule
- ESLint rule warning on hardcoded color values in TSX files
- Integrate into `@repo/config`
- Prevents regression
- **Priority:** p2 | **Complexity:** small

---

## M4: App Batch 1 — Most Complete (Component Migration + Tests)

**Goal:** Migrate 8 mature, actively-used apps to `@repo/ui` components and add app-specific test coverage.

### Cross-Cutting Issue

#### 1. Extend `@repo/ui` with missing common components
- Audit gaps needed for migration. Likely: `Table`, `DataGrid`, `StatusBadge`, `LoadingSkeleton`, `ErrorBoundary`, `EmptyState` variants
- Follow existing patterns: forwardRef, CVA, cn()
- **Priority:** p1 | **Complexity:** large

### Per-App Issues (2 each = 16 issues)

Each app gets:
- **Component migration** — Replace inline buttons, cards, badges, inputs with `@repo/ui`. Preserve functionality. Leave unique components but ensure they use theme tokens.
- **App-specific tests** — Data fetching (mock Supabase, verify query shape), key user flows (render, check content), auth gate (redirect behavior). Use `@repo/test-utils`.

**Apps:**

2-3. **Command Center** — Hub page + shared module chrome only (sub-module internals are M6). Largest migration surface.
4-5. **Accounts** — Already uses `@repo/ui`. Tests for client list, PR aggregation, contact display.
6-7. **Standup** — Replace inline cards with shared Card. Test Slack/GitHub data aggregation.
8-9. **Summaries** — Replace inline UI. Test Zoom/Slack/Jira summary rendering.
10-11. **Meeting Summaries** — Test meeting list + detail views.
12-13. **Uptime** — Already uses `@repo/ui` partially. Complete migration. Test status badge logic, history charts.
14-15. **Sentiment** — Replace inline UI. Test mood entry rendering, changelog, docs pages.
16-17. **Sprint Planning** — Replace inline UI. Test backlog grouping by client, archive display.

---

## M5: App Batch 2 — Mid-Tier (Component Migration + Tests)

**Goal:** Migrate 10 feature-complete, simpler apps. Mostly single-page with static or lightly dynamic data.

### Per-App Issues (2 each = 20 issues)

Same pattern as M4.

1-2. **Dad Joke of the Day** — Replace joke cards, category pills, viewer. Test JOTD selection, category filtering.
3-4. **Generations** — Dynamic `/[gen]` routes. Replace slang cards, quiz UI. Test generation routing, term rendering, quiz flow.
5-6. **Slang Translator** — Replace translator UI. Test slang lookup, bi-directional display.
7-8. **Cringe Rizzler** — Dark-themed, animated blobs. Replace buttons/cards, keep custom animation. Test phrase generation API, about page.
9-10. **Daily Updates** — Replace feed cards, profile badges. Test update aggregation, category filtering.
11-12. **Proper Wine Pour** — Replace calculator UI, restaurant cards, wall posts. Test pour calculation, community wall.
13-14. **HSPT Practice** — Replace question cards, timer, score display. Test section selection, timed exam flow, scoring.
15-16. **HSPT Tutor** — Replace inline UI. Test adaptive question selection, weak-spot prioritization.
17-18. **Roblox Dances** — Replace dance cards, submission UI. Test dance listing, submission rendering.
19-20. **AI Calculator** — Already partially migrated. Complete protected calculator page. Test ROI calculation, public-to-protected gate.

---

## M6: App Batch 3 — Stubs, Showcase & CC Sub-Modules

**Goal:** Build out stub apps, migrate showcase apps (lighter touch to preserve personality), and cover Command Center's 21 sub-modules.

### Stub Apps (1 issue each = 3 issues)

#### 1. Area 52
- Define purpose and build skeleton with placeholder content
- Proper layout, auth gate, at least one functional page
- Uses `@repo/ui` from the start
- **Priority:** p2 | **Complexity:** large

#### 2. Lighthouse
- Performance monitoring dashboard
- Pull Lighthouse CI or CrUX API scores for tracked sites
- Table of sites, score history chart, detail view
- Uses `@repo/ui`
- **Priority:** p2 | **Complexity:** large

#### 3. Sales
- Leads pipeline dashboard
- Extract and promote data/UI from Command Center's `cc-leads` module
- Uses `@repo/ui`
- **Priority:** p1 | **Complexity:** large

### Showcase Apps — Lighter Migration (2 each = 10 issues)

Preserve unique UI personality. Token enforcement + shared primitives only.

4-5. **Brommie Quake** — Extract 29KB animation logic into custom hook. Replace standard buttons/cards. Keep animation. Tests for render and animation trigger.
6-7. **Alpha Wins** — Replace filter controls and modal with shared UI. Keep gallery grid. Tests for search, filtering, modal.
8-9. **Superstars** — Replace cards and profile layout. Tests for routing, single-person redirect.
10-11. **Travel Collection** — Replace with shared MediaCard/Card. Tests for property listing.
12-13. **Soccer Training** — Replace category/drill cards. Tests for category rendering, drill display.

### Command Center Sub-Modules (3 batch issues = 3 issues)

#### 14. CC sub-module batch 1 (7 modules)
- Leads, Agents, Users, Crons, PR Review, App Access, AlphaClaw
- Data-heavy operational modules
- Replace inline tables/cards with `@repo/ui`
- Tests for data rendering per module
- **Priority:** p1 | **Complexity:** large

#### 15. CC sub-module batch 2 (7 modules)
- Ideas, Recipes, Gallery, Architecture, Client Health, Meeting Summaries, AI Scripts
- Mix of content and config modules
- Same migration pattern + tests
- **Priority:** p1 | **Complexity:** large

#### 16. CC sub-module batch 3 (7 modules)
- Concerts, Contentful, Iron, Meme Generator, Rizz Guide, Shopping List, Team USF
- Lighter/fun modules
- Same migration pattern + tests
- **Priority:** p2 | **Complexity:** medium

---

## M7: Deep Test Coverage

**Goal:** Harden the test suite with integration tests, edge cases, and E2E for critical flows.

### Issues

#### 1. Auth flow E2E tests
- Playwright: login → permission check → redirect → access grant
- Cover: successful login, unauthorized redirect, self-enroll, permission hierarchy, cross-subdomain cookies
- **Priority:** p0 | **Complexity:** large

#### 2. Billing flow integration tests
- Stripe webhook handling (all event types)
- Subscription lifecycle: create, update, cancel, trial
- `hasFeatureAccess()` with various subscription states
- Mock Stripe API responses
- **Priority:** p1 | **Complexity:** medium

#### 3. Proxy/routing integration tests
- Subdomain resolution for all 27 apps
- Unknown subdomain → 404
- Localhost dev routing
- `hrefWithinDeployedApp()` across environments
- Middleware chain: host → Auth0 → rewrite
- **Priority:** p1 | **Complexity:** medium

#### 4. Shared package unit tests
- `@repo/auth`: permission hierarchy, session handling, multi-tenant client factory
- `@repo/db`: query helpers, typed responses
- `@repo/ui`: render every component with all variant combinations
- `@repo/billing`: customer/subscription helpers
- **Priority:** p1 | **Complexity:** large

#### 5. App registry integrity tests
- No duplicate slugs or subdomains
- Every `routeGroup` maps to an existing directory
- Every auth-gated app has a layout calling `requireAppLayoutAccess()`
- Every app has a valid `tier` field
- **Priority:** p1 | **Complexity:** small

#### 6. Error boundary and edge case tests
- Unauthenticated API calls, expired sessions mid-navigation
- Supabase query failures, malformed webhook payloads
- Missing env vars at startup
- Verify graceful degradation and user-facing error messages
- **Priority:** p2 | **Complexity:** medium

#### 7. CI pipeline setup
- GitHub Actions workflow: `pnpm test` on PR
- Playwright E2E on merge to main
- Coverage reports with threshold enforcement
- Integrates with Alpha Loop's `test_command`
- **Priority:** p0 | **Complexity:** medium

---

## Dependency Graph

```
M1 (Shared Foundations)
├── M2 (Universal Auth Gate) — depends on M1.4 (auth middleware)
├── M3 (Theme Token Audit) — independent of M2, can run in parallel
│   ├── M4 (App Batch 1) — depends on M3 for token compliance
│   ├── M5 (App Batch 2) — depends on M3
│   └── M6 (App Batch 3) — depends on M3
└── M7 (Deep Test Coverage) — depends on M1-M6
```

M2 and M3 can run in parallel after M1 completes. M4-M6 are sequential (each builds on shared UI extensions from the prior batch). M7 is the capstone.

---

## Alpha Loop Configuration Notes

- **Repo:** lr-apps (GitHub)
- **Agent:** claude
- **Base branch:** main
- **Test command:** `pnpm test`
- **Label:** `ready`
- Issues should be created with `- [ ]` acceptance criteria in the body
- Each milestone maps to one Alpha Loop session
- M2 issues are ideal candidates for batch mode (mechanical, repetitive)
