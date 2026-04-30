# Plan: E2E tests for the Soccer Training app

> Drafted 2026-04-30. Companion to `2026-04-30-ideas-e2e-testing.md` —
> reuse `apps/web/playwright.config.ts`, `loggedInPage`/`unauthPage`
> from `tests/e2e/fixtures/auth.fixture.ts`, and `seedPermission` from
> `tests/e2e/helpers/db.ts`. Soccer Training is `template: "minimal"`,
> `tier: "free"`, `auth: true`, `permission: "view"` — surface is
> intentionally narrow: a gate plus a static client-side drill grid
> driven by `app/apps/soccer-training/data/drills.ts`.

---

## 1. Setup

- Env: existing `E2E_TEST_USER_*` and Supabase service-role vars; no new ones.
- Permissions: `beforeAll` calls `seedPermission(userId, "soccer-training", "view")`; `afterAll` removes it. Registry permission is `view`, not `edit` — match it so the gate path is exercised faithfully.

## 2. Test data strategy — no helper, on purpose

There is no `helpers/soccer-training.ts` and there should not be one. The app has zero persistence: `DRILLS` is a hardcoded array, all filter/search/modal state is React local state, and there's no Supabase table, server action, or Stripe gate. Ideas needed `helpers/ideas.ts` because UI-driven seeding of mixed-state rows was slow; here the seed *is* the source file, deterministic and already covered by `app/apps/soccer-training/__tests__/drill-library.test.tsx`.

E2E for this app is therefore an **access + smoke** layer: prove the gate works through Auth0 → `requireAppLayoutAccess` and that the static page stays interactive. Filter/search combinatorics already have unit coverage; rerunning them through a browser would just be slower.

## 3. Use-case catalog

### Group A — Access & smoke (the only group)

1. Unauth user → `/apps/soccer-training` redirects to Auth0 login.
2. Auth user without permission → `/unauthorized` (proves the registry `permission: "view"` enforcement in `layout.tsx`).
3. Auth user with `soccer-training:view` → page renders: header `⚽ Soccer Training`, hero `Soccer Training Drills`, and the three stat tiles (`Drills`, `Content`, `Categories`).
4. Drill grid renders at least one card. Asserting count, not the specific names, since `DRILLS` may grow.
5. Search `Ladder` narrows the grid; `Dynamic Warm-Up` disappears.
6. Category tab `Warm-Up` filters; `All Drills` restores.
7. Combined `Warm-Up + Advanced` shows the empty state with `Clear filters` button — guards the no-overlap branch.
8. Click a card → modal opens with drill heading and `Watch on YouTube` link; close button restores the grid.
9. Modal backdrop click closes the modal — easy to break by wrapping the overlay in a new div, so worth one explicit assertion.
10. Header nav links resolve to `/apps/soccer-training` and `/` — guards against a refactor dropping the anchors.

Ten tests, one file. **No Groups B-H.** No CRUD, no status, no hide/snooze, no AI plan, no entitlement.

## 4. Spec organization

```
apps/web/tests/e2e/soccer-training/
  access.spec.ts   # all of Group A
```

Single `describe`. `unauthPage` for #1; `loggedInPage` for #2-#10.

## 5. Selector strategy

The unit tests already use visible text (`Search drills…`, `All Drills`, `Warm-Up`, `Beginner`, `Watch on YouTube`, `Clear filters`) and `aria-label` (`Close`, `Play …`). E2E should reuse those queries — one selector vocabulary, not two. Add only two `data-testid`s:

- `drill-modal` on the `DrillModal` root — Playwright needs a stable open/closed handle without counting `getAllByText`.
- `drill-card` on the `Card` wrapper in `DrillCard` — lets #4 assert grid cardinality without coupling to drill names.

## 6. Running

- `pnpm --filter web test:e2e` — no new script.
- `webServer.env.APP_SELF_ENROLL_SLUGS` does **not** need `soccer-training` added: the suite seeds permission explicitly. Self-enroll would mask gate regressions.

## 7. Out of scope

- DrillLibrary behavior (search, filter cross-products, modal content, VideoEmbed iframe swap) — fully covered by the existing jsdom unit suite. E2E covers the *pipeline* (Auth0 → registry → `requireAppLayoutAccess` → render); jsdom covers the *behavior*.
- YouTube iframe load (third-party, flaky).
- Visual regression.
- `position` filtering (`winger`/`striker`/`both`) — not exposed in the UI.

---

## Execution order

1. Add the two `data-testid` hooks (§5).
2. Write `apps/web/tests/e2e/soccer-training/access.spec.ts` — #1, #2 first (gate), then #3-#10 in source order.
