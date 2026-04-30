# Plan: E2E tests for the Superstars app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Reuse existing infra: Playwright at `apps/web/playwright.config.ts`, Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`), and `seedPermission`/`deletePermission` from `tests/e2e/helpers/db.ts`. No new fixtures or DB helpers needed.

## 1. Why this plan is short (Group A only)

Superstars is `template: "minimal"`, `tier: "free"`, `permission: "view"`, with **no per-user persistence** — content is a static `data/people.json` bundled at build time (see `apps/web/app/apps/superstars/data/people.json`). The app has exactly two routes: a grid index (`/apps/superstars`) and a per-person profile (`/apps/superstars/[person]`). No CRUD, no server actions, no DB rows. So Group B–H from the Ideas plan don't apply.

Component behavior (lightbox toggle, profile section rendering, layout nav) is already covered by Vitest unit tests in `apps/web/app/apps/superstars/__tests__/` (`page.test.tsx`, `layout.test.tsx`, `person-card.test.tsx`, `person-profile.test.tsx`). E2E should only cover what unit tests can't: the **layout-level auth gate** and **real cross-route navigation** in a browser.

## 2. Setup (prereq)

Reuse the same env vars Ideas uses:

- `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for `seedPermission`)

The layout calls `requireAppLayoutAccess("superstars")`, so an authenticated user still needs an `app_permissions` row. Two options:

1. Add `superstars` to `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts` `webServer.env` so a fresh user auto-enrolls (matches how `command-center` and `standup` work today).
2. Or use `seedPermission(userId, "superstars", "view")` in `beforeAll` and `deletePermission` in `afterAll`.

Recommend option 2 — explicit, mirrors Ideas, doesn't widen the self-enroll surface.

## 3. Use-case catalog — Group A only (Access & navigation)

### Group A — Access, gating, navigation (smoke)

1. Unauth user → `/apps/superstars` redirects to Auth0 login (use `unauthPage` fixture, assert URL matches `/\.auth0\.com\//`)
2. Authed user without `superstars` permission → `/unauthorized` page (delete permission first, then visit)
3. Authed user with `superstars:view` permission → grid renders header `⭐ Superstars` and at least one `PersonCard` link
4. Click a person card → URL becomes `/apps/superstars/<id>`, hero `<h1>` shows that person's name
5. From a profile, header logo `⭐ Superstars` link returns to `/apps/superstars` index
6. Direct visit to `/apps/superstars/non-existent-id` → Next.js `notFound()` 404 page (per `[person]/page.tsx` line 98)
7. Profile page metadata: `<title>` matches `${name} — Superstars` (validates `generateMetadata` runs server-side, not just in unit tests)

That's the entire useful E2E surface. Seven tests, one spec file.

## 4. Spec organization

```
apps/web/tests/e2e/superstars/
  access.spec.ts   # all of Group A
```

Single file because the suite is small enough that splitting hurts readability. `beforeAll` seeds `view` permission; `afterAll` deletes it. No `afterEach` cleanup needed — there's no per-test state to reset.

## 5. Selector strategy

Tests can rely on **stable text** (`⭐ Superstars`, person names from `people.json`) and **URL assertions** — no `data-testid` hooks needed for this small surface. Person IDs in `people.json` (e.g. `sam-reynolds`) are stable enough to use directly. This avoids gold-plating the components for a 7-test suite.

If `people.json` shrinks to a single person, `page.tsx` short-circuits to a "Redirecting…" link (lines 17–30). Test 3 must read `peopleData` to assert the right rendered branch — import the JSON, not hard-code.

## 6. Running

- `pnpm --filter web test:e2e -- superstars/` (Playwright filters by path)
- Local dev server is reused; CI runs `next build && next start`
- No Supabase migrations to apply for this app

## 7. Out of scope

- Visual regression on the hero glow / marquee animations — separate effort, brittle in headless Chromium
- Lightbox interaction, timeline rendering, stats cards — already covered by `person-profile.test.tsx`
- Per-person content correctness (bios, articles, quotes) — content lives in JSON; assert structural rendering, not strings

## Execution order

1. Create `apps/web/tests/e2e/superstars/access.spec.ts` with all 7 tests (no helper file required)
2. Run locally to confirm `seedPermission`/`deletePermission` flow works for a `view`-only app
3. Wire into CI — no new env vars beyond what Ideas already needs
