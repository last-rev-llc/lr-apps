# Plan: E2E tests for Brommie Quake

> Drafted 2026-04-30. Companion to `2026-04-30-ideas-e2e-testing.md`.

Brommie Quake is a `template: "minimal"`, `tier: "free"`, `auth: true` fan page (`apps/web/app/apps/brommie-quake/`). It is a single client component that renders static content from `data/content.json` plus a "Start the Quake" button that fires a confetti/screen-shake DOM effect. There is no server action, no DB row, no entitlement, no form. E2E coverage therefore collapses to access gating + a smoke check that the static content and the one interactive button work end-to-end against a real Next.js render — everything else belongs in the existing vitest specs (`__tests__/page.test.tsx`, `__tests__/layout.test.tsx`).

We extend the existing infra (`tests/e2e/fixtures/auth.fixture.ts`, `tests/e2e/helpers/db.ts`); we do not add a new fixture file or a `helpers/brommie-quake.ts` — there is nothing to seed or clean up.

---

## 1. Setup

- **Env vars** (already used by existing specs):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Permissions**: `beforeAll` calls `seedPermission(userId, "brommie-quake", "view")` to satisfy `requireAppLayoutAccess("brommie-quake")` in `layout.tsx`. `afterAll` calls `deletePermission` so the next run starts clean.
  - Note: `brommie-quake` is `tier: "free"`, so self-enroll would also work — but explicit `seedPermission` keeps the test deterministic regardless of `APP_SELF_ENROLL_SLUGS`.
- **No DB helper** (`tests/e2e/helpers/brommie-quake.ts` is intentionally absent): the page persists nothing, so there is no row to seed, list, or delete. The Ideas plan's `helpers/ideas.ts` exists because Ideas writes to `ideas` rows on every action; Brommie Quake has no equivalent.

## 2. Test inventory — Group A only

Group A (Access + smoke) is the entire surface. There is no Group B (CRUD), C (state), D (lifecycle), etc., because there is no persisted state.

### Group A — Access & smoke

1. Unauth user → `/apps/brommie-quake` redirects to login (Auth0). Asserts the `auth: true` registry flag is honored by `requireAppLayoutAccess`.
2. Auth user **without** `brommie-quake` permission, with self-enroll disabled for the slug → `/unauthorized`. Run by deleting the permission row and overriding `APP_SELF_ENROLL_SLUGS` to a value that excludes `brommie-quake`, since the free tier would otherwise auto-grant.
3. Auth user **with** `brommie-quake:view` permission → page renders. Assertions:
   - Hero title contains "Marc" and "Bromwell" (the surrounding `&ldquo;My Days&rdquo;` is split across DOM nodes; substring is the stable shape).
   - "🫨 Start the Quake" button is visible and enabled.
   - All four `STATS[].label` values from `data/content.json` are present (`Kid Started It`, `Full Stadium Wave`, `Crowd Volume`, `Hype Level`) — guards against the JSON file getting accidentally truncated during a content edit.
   - First quote author (`— Section 109, Season Ticket Holder`) is present.
4. Click "Start the Quake" → no console error, no thrown exception, page remains on the same URL. We do **not** assert on the confetti DOM (60 ephemeral elements removed after ~2.1s) or on `document.body.style.animation`; both are timing-coupled and would flake. The vitest spec already asserts the click handler does not throw — e2e adds the value of running it under a real browser engine where `IntersectionObserver`, `requestAnimationFrame`, and CSS animations actually execute.

That is the full catalog: **4 tests, 1 spec file**.

## 3. Spec organization

```
apps/web/tests/e2e/brommie-quake/
  access.spec.ts   # Group A — all 4 tests above
```

One file, no Group B/C/D specs. The skill template `crud.spec.ts` is intentionally not used: there is no entity, no form, no row menu.

## 4. Selectors

Add two `data-testid` hooks to `apps/web/app/apps/brommie-quake/page.tsx`:

- `bq-hero-title` on the `<h1 className="bq-hero-title">` — avoids matching the title via the emoji-prefixed surrounding text.
- `bq-quake-button` on the "Start the Quake" `<Button>` — the emoji prefix (`🫨`) is unstable for cross-platform Playwright text matching.

Stat labels and quote authors are matched by `getByText` of the JSON values directly, since those strings are the contract being protected. Adding testids there would be ceremony.

## 5. Running

- Local: `pnpm --filter web test:e2e` (script reused). `playwright.config.ts` already has `reuseExistingServer: !CI`.
- CI: the `webServer.env.APP_SELF_ENROLL_SLUGS` default is `"command-center,standup"`, which already excludes `brommie-quake` — good; test 2 (unauthorized path) does not need any override beyond not seeding the permission. Test 3 explicitly seeds permission, so it is independent of self-enroll.

## 6. Out of scope

- Confetti DOM, screen shake animation, particle rendering — all visual; covered (where it makes sense) by the existing vitest spec via "click does not throw".
- Stats/quotes content audit — `__tests__/page.test.tsx` already iterates `content.json` and asserts each label/author renders. E2E re-asserts only the four stat labels and one author as a smoke signal; full coverage stays in vitest.
- Layout permission unit test — `__tests__/layout.test.tsx` covers `requireAppLayoutAccess("brommie-quake")` invocation and redirect digests.

## 7. Execution order

1. Add the two `data-testid` hooks (§4) — small PR, no behavior change.
2. Write `apps/web/tests/e2e/brommie-quake/access.spec.ts` with the four tests above.
3. Done. No follow-up specs are planned because no follow-up surface exists.

---

## Why this plan is short

The Ideas plan is ~140 lines because Ideas has 8 distinct interaction surfaces (CRUD, status/rating, hide/snooze, filters, search, view modes, AI-plan entitlement, modal-centering regression). Brommie Quake has one — render the page — plus one button that fires a fire-and-forget animation. Padding a minimal app's plan with synthetic groups would either invent infrastructure that has no production code to back it (a "DB helper" with nothing to query), or reassert what the vitest specs already cover. The honest scope is Group A.
