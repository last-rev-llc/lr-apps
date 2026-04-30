# Plan: E2E tests for the Dad Joke of the Day app

> Seed for `alpha-plan`. Drafted 2026-04-30.

The app is a `template: "minimal"`, `tier: "free"`, `permission: "view"` read-only viewer over the shared `dad_jokes` table. There is no per-user data, no create/edit UI, no AI gating, and no upgrade dialog. Existing infra (`apps/web/playwright.config.ts`, the `loggedInPage` fixture in `tests/e2e/fixtures/auth.fixture.ts`, and `seedPermission` in `tests/e2e/helpers/db.ts`) is sufficient — we deliberately do **not** add a `tests/e2e/helpers/dad-joke-of-the-day.ts` helper. See §2 for the rationale.

Vitest unit tests already exist in `apps/web/app/apps/dad-joke-of-the-day/__tests__/` (`queries.test.ts`, `joke-viewer.test.tsx`, `page.test.tsx`, `layout.test.tsx`). Those cover the deterministic JOTD math, rating arithmetic, category filtering and empty-state branches. E2E only covers the bits a unit test cannot — real auth, real proxy, real Supabase rows, and the actual click-to-reveal-to-rate flow against a running browser.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by the auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used by `helpers/db.ts`
- **No new fixtures.** Reuse `loggedInPage` and `unauthPage` from `auth.fixture.ts`.
- **Permissions.** Free-tier apps allow self-enroll, but in CI (`next start`, not `next dev`) self-enroll is gated by `APP_SELF_ENROLL_SLUGS`. Two options, pick one and stick with it for this app:
  1. Add `dad-joke-of-the-day` to `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts`'s `webServer.env`. Lowest-friction; matches what `command-center`/`standup` do today.
  2. Call `seedPermission(userId, "dad-joke-of-the-day", "view")` in `beforeAll` and `deletePermission` in `afterAll`. More explicit; needed anyway for the "no permission → unauthorized" negative case below.
  Recommendation: do **both**. The negative test in Group A needs an unauthorized state, so we deliberately revoke before that one assertion (`deletePermission`, navigate, assert, restore). Self-enroll keeps the rest of the suite stable when run out-of-order.

## 2. Test data strategy

Skip the per-app helper file. The Ideas app needed `seedIdea/listIdeasForUser/deleteIdeasForUser` because every spec depends on a clean per-user starting state. Dad Joke is read-only over a shared, app-seeded `dad_jokes` table — no user owns rows, and the only writes are best-effort `times_shown` / aggregated `rating` updates wrapped in `try/catch` (see `joke-viewer.tsx`). Adding a helper would invent state we don't actually need to assert on.

What we do need:

- **Pre-seed jokes once** in `global-setup.ts` (or a `beforeAll` in `dad-joke-of-the-day/access.spec.ts`) **only if** the table is empty. Use the service-role client inline. Insert ~3 jokes spanning ≥2 categories so the category-filter spec has something to filter. Tag them with a fixed `id` range (e.g. setup text starts with `"e2e:"`) so global teardown can `DELETE WHERE setup LIKE 'e2e:%'` if needed.
- **Direct DB read (one assertion only)** in the rating spec to confirm `times_rated` incremented. We do this with an inline `createClient(url, serviceKey)` call inside the spec — one file, one call site, not worth a helper module.

Why no helper: a helper that wraps a single `supabase.from('dad_jokes').select(...)` adds indirection without reuse. If a second spec ever needs the same query we promote it then.

> **Note on the schema.** No `supabase/migrations/*dad_jokes*.sql` exists in the repo today (verified 2026-04-30). The table is created and seeded out-of-band. Before this plan ships an actual spec, confirm the migration is committed (and has a paired `.down.sql` per non-negotiable #5) — otherwise CI will run against an empty `dad_jokes` table and Group A test 3 will land on the `EmptyState` branch.

## 3. Use-case catalog (test inventory)

All Group A — there are no CRUD, no filters beyond category, no view modes, and no AI gating. The app is small enough that one or two specs cover it.

### Group A — Access, render, and the one interactive flow

1. Unauth user → `/apps/dad-joke-of-the-day` redirects to login (uses `unauthPage`)
2. Auth user **without** `dad-joke-of-the-day` permission and self-enroll disabled → `/unauthorized` page (deliberately revoke with `deletePermission` for this test only, then restore)
3. Auth user with permission → page renders with header text "Dad Joke of the Day" and the "🗓️ Joke of the Day" mode badge
4. Empty-state branch → when seeded jokes are absent, `EmptyState` with "No jokes found" renders (skipped if seed is present; assert via `getByText`)
5. Punchline reveal → click "👇 Reveal Punchline" → punchline text becomes visible AND the rating row ("Rate this joke:") appears
6. Rating submit → click any rating button (e.g. "😂") → button row disappears, "Rated 😂 — thanks!" message renders, and a direct DB read shows `times_rated` incremented for that joke id (proves the client-side write in `joke-viewer.tsx` actually hit Supabase via `@repo/db/client`, which is the only thing a unit test can't verify)
7. Random joke → click "🎲 Random Joke" → mode badge flips to "🎲 Random Joke" and setup text changes from the JOTD setup (re-asserting on a different `data-testid="joke-setup"` text node; small flake risk if random picks the same joke — pool ≥ 3 in seed makes that vanishingly unlikely, but use `expect.poll` with a short timeout to retry once if needed)
8. Category filter → click a non-"All" category badge → mode flips back to "🗓️ Joke of the Day" (per the `handleCategoryChange` logic) and the rendered category label matches the selection
9. About page link → header nav "About" → `/apps/dad-joke-of-the-day/about` renders the "Peak Dad Energy" section heading

That's it. No Groups B–H — they don't apply.

## 4. Spec organization

```
apps/web/tests/e2e/dad-joke-of-the-day/
  access.spec.ts    # A1, A2, A3 — auth/permission gating + page boot
  viewer.spec.ts    # A4–A9 — reveal, rate, random, category filter, about
```

Two files instead of one keeps the per-test permission revoke/restore in `access.spec.ts` from leaking into `viewer.spec.ts`. Each file: `beforeAll` ensures `seedPermission(userId, "dad-joke-of-the-day", "view")`; no `afterEach` cleanup needed because there is no per-user state to clean.

## 5. Selector strategy (do this before writing specs)

The viewer leans on emoji-laden button copy and class names. Add a small set of `data-testid` hooks in `components/joke-viewer.tsx` and the `layout.tsx` header — surgical, no behavior change:

- `joke-card`, `joke-setup`, `joke-punchline`
- `reveal-punchline-button`
- `rating-button-${key}` (one per `RATINGS` entry — `groan`, `eyeroll`, `funny`, etc.)
- `rated-confirmation` (the "Rated … — thanks!" line)
- `mode-badge` (the "🗓️ Joke of the Day" / "🎲 Random Joke" pill)
- `category-pill-${name}` and `category-pill-all`
- `random-joke-button`, `jotd-button`
- `app-header-title` on the layout `<h1>` (for the access-spec render assertion)

Querying by emoji is fragile — copy changes (and *will* change for an app whose entire premise is groan-worthy text) shouldn't break tests.

## 6. Running

- `pnpm --filter web test:e2e` (existing script) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`); self-enroll is open in `NODE_ENV=development` so the permission seed is belt-and-suspenders
- CI: add `dad-joke-of-the-day` to the `APP_SELF_ENROLL_SLUGS` default in `playwright.config.ts` so test 3 doesn't depend on `seedPermission` racing the page load

## 7. Out of scope

- Unit-tested logic — JOTD determinism, rating arithmetic, category derivation, EmptyState branch — all covered in `apps/web/app/apps/dad-joke-of-the-day/__tests__/`. Do not duplicate.
- Visual regression / screenshot diff — separate effort.
- Cross-day JOTD stability — would require freezing system time across the browser process; the unit test in `queries.test.ts` covers the algorithm.
- Concurrent-rating race conditions on `times_rated` — the client does a read-modify-write that is racy by design; tracked best-effort in the code's own `try/catch`. Not an E2E concern.

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Confirm `dad_jokes` migration + seed exists in `supabase/migrations/` (with paired `.down.sql`); if missing, that's a blocker, not part of this plan
3. Add `dad-joke-of-the-day` to `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts`
4. Write `access.spec.ts` (A1–A3) — covers the auth/proxy boundary, highest value
5. Write `viewer.spec.ts` (A4–A9) — covers the one interactive flow
