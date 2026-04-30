# Plan: E2E tests for the Cringe Rizzler app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is sufficient — Playwright is wired at `apps/web/playwright.config.ts`, the `loggedInPage` / `unauthPage` fixtures live in `tests/e2e/fixtures/auth.fixture.ts`, and `tests/e2e/helpers/db.ts` exposes `seedPermission` / `deletePermission`. Reuse, don't add.

The app is `template: "minimal"`: a three-tab client component (`components/cringe-app.tsx`) that calls two server actions in `lib/actions.ts`. Saved phrases live in `useState` and disappear on reload — there is no per-user persistence and no migrations for this slug. That keeps the E2E surface narrow: access gating, server-action wiring, in-session UI state.

---

## 1. Setup (prereq)

- **Env vars** (already used elsewhere; nothing new):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for `seedPermission`
- **Permissions**: registry entry requires `permission: "view"`. In `beforeAll` call `seedPermission(userId, "cringe-rizzler", "view")`; tear down in `afterAll`. The slug is **not** in `APP_SELF_ENROLL_SLUGS` (see `playwright.config.ts`), so seeding is the only path in for CI.
- **No new fixtures, no new DB helpers** — minimal app, no rows to seed/clean.
- **OpenAI key**: server actions branch on `OPENAI_API_KEY`; in CI it will be unset and we'll exercise the deterministic `FALLBACK_PHRASES` / fallback caption path. That's the assertion target — running against the live model is non-deterministic and out of scope.

## 2. Test data strategy

There is no app data to seed. The only "state" is:

1. The `app_permissions` row for the test user — handled by `seedPermission`.
2. In-memory React state (`saved`, `phrase`, `meme`) — exercised purely through the UI within a single page lifetime.

We do not need a `helpers/cringe-rizzler.ts` file. If a future migration adds persistence (saved phrases stored per user), revisit and add one then.

## 3. Use-case catalog

### Group A — Access, gating, generate, save (the whole app)

1. Unauth user → `/apps/cringe-rizzler` redirects to login (mirrors `auth.spec.ts` shape)
2. Auth user without `cringe-rizzler` permission → unauthorized response (the `requireAppLayoutAccess("cringe-rizzler")` call in `layout.tsx` is the gate)
3. Auth user with `cringe-rizzler:view` → page renders, header shows "💀 Cringe Rizzler", three tabs visible (Phrases / Memes / Glossary)
4. Phrases tab: empty state shows "Hit the button to generate your first cringe phrase"; clicking "Generate New Phrase" populates a phrase card with one of the deterministic fallback phrases (assert text matches one of `FALLBACK_PHRASES`)
5. Save button on a generated phrase pushes it into the "Saved This Session" list; reloading the page clears the list (regression guard against accidentally adding persistence without auth/owner scoping)
6. Glossary tab: search input narrows the term grid; clearing the search restores all terms; selecting a category filters; the "X term(s)" count updates

That's it for Group A. Six tests cover gating + the only two non-network-dependent flows.

### Out of Group A (deferred / not in this plan)

- **Memes tab** depends on `https://api.imgflip.com/get_memes` (third-party network) and a `<canvas>` draw. Both are flaky in CI and aren't worth covering here — the server action's fallback caption path is already covered by the unit test in `__tests__/actions.test.ts`. If we want coverage, mock the imgflip route via Playwright's `page.route()` in a follow-up.
- **AI live path** (when `OPENAI_API_KEY` is set) — non-deterministic; covered indirectly by the action unit tests. Skip.
- **About page** — pure static content, exercised by `__tests__/about.test.tsx` (Vitest). No E2E value.

## 4. Spec organization

```
apps/web/tests/e2e/cringe-rizzler/
  access-and-generate.spec.ts   # Group A, all six tests in one file
```

One file because the suite is small and shares a single `beforeAll` permission seed. Splitting would add ceremony without value.

`beforeAll`: `seedPermission(userId, "cringe-rizzler", "view")`.
`afterAll`: `deletePermission(userId, "cringe-rizzler")` so the test doesn't bleed permission state into other suites.

## 5. Selector strategy

The current component renders by emoji + text. To avoid coupling tests to copy that exists explicitly to be silly and may change, add `data-testid` hooks to the high-traffic interactions in `components/cringe-app.tsx` before writing specs:

- `cringe-tab-${phrases|memes|glossary}` on each `TabsTrigger`
- `phrase-generate-button`, `phrase-result`, `phrase-save-button`, `phrase-saved-list`, `phrase-saved-item`
- `glossary-search-input`, `glossary-category-select`, `glossary-count`, `glossary-term-card`

Two reasons over text selectors: (a) the copy is intentionally cringe and likely to churn; (b) emoji-prefixed labels (`"💀 Cringe Rizzler"`) are awkward to match reliably across font/render quirks.

## 6. Running

- Local: `pnpm --filter web test:e2e` — dev server is reused (`reuseExistingServer: !CI`).
- CI: same command; `next build && next start` flow already in `webServer.command`. Note `APP_SELF_ENROLL_SLUGS` does **not** include `cringe-rizzler` and we should not add it — `seedPermission` is the right path.

## 7. Out of scope

- Server-action unit tests already exist at `apps/web/app/apps/cringe-rizzler/__tests__/actions.test.ts`, plus component tests for `cringe-app.test.tsx`, `about.test.tsx`, `layout.test.tsx`, `slang.test.ts`, `utils.test.ts`. E2E only covers gating + UI happy path; don't duplicate.
- Visual regression on the canvas-rendered meme — separate effort.
- Persistence/multi-session behavior — does not exist; do not test what the app does not do.

---

## Execution order

1. Add `data-testid` hooks per §5 — small no-behavior PR.
2. Write `access-and-generate.spec.ts` with all six tests.
3. Verify locally with credentials, then enable in CI.
