# Plan: E2E tests for the Generations app

> Drafted 2026-04-30. Companion plan to the Ideas e2e plan; structure mirrors that doc.

Generations is a `template: "minimal"`, `tier: "pro"` app that ships a slang hub at `/apps/generations` plus a tabbed per-generation page at `/apps/generations/[gen]` (Dictionary / Translator / Quiz / Trending). All data is bundled JSON (`apps/web/app/apps/generations/data/*.json`) — there is no DB persistence, no server actions, no per-user state. That shapes this plan: e2e is mostly access/gating + client interactivity, not CRUD. We extend the existing Playwright infra (`apps/web/playwright.config.ts`, `loggedInPage` fixture, `helpers/db.ts` for permission seeding) — no new fixtures needed.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture (this is the Pro user; needs an active Pro subscription row when `tier_enforcement_enabled` flag is on)
  - `E2E_TEST_USER_FREE_EMAIL/PASSWORD/ID` — second user on the free tier, used to drive the upgrade-gate flow (Group A test 5)
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`. The free-tier user spec gets a second context loaded with a different `storageState` file (or `loginWithAuth0` against a fresh context).
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "generations", "view")` — the registry entry has `permission: "view"`, no `publicRoutes`, no self-enroll override, so the gate is hard. Tear down in `afterAll`.
- **Tier flag**: tests assume `tier_enforcement_enabled` is on for the Pro and free user IDs. If you toggle it off, Group A test 4/5 become no-ops (the layout returns access for all). Document the env in the spec header.

## 2. Test data strategy

No `tests/e2e/helpers/generations.ts` is needed. Justification:

- The app reads from static JSON at build time (`./data/${slug}.json`); there is no `generations` table to seed or clean up.
- All UI state (search query, active category pill, quiz progress, translator direction) lives in component `useState` and resets per page load — tests don't need cross-test cleanup.
- Test data is the JSON fixtures themselves. Specs that need stable assertions (e.g. "the top trending term for gen-z is X") should pin against term IDs in `data/gen-z.json` rather than hard-coded strings, so editing the JSON doesn't silently break tests. Helper functions in the spec file (`pickTopTermForGen(slug)`) are fine.

The only Supabase work is `seedPermission` / `deletePermission` from the existing `helpers/db.ts`, plus optionally a Pro subscription row via service-role insert into `subscriptions` — wrap that in a small `seedProSubscription(userId)` helper inside the existing `helpers/db.ts` if not already present, since this is the first `tier: "pro"` app the e2e suite covers end-to-end.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/generations` redirects to login
2. Auth user without `generations` permission → unauthorized page (no `publicRoutes` means even `/` is gated)
3. Auth Pro user with `generations:view` permission → hub renders with header "Generations" and the 6 generation cards
4. Auth free-tier user with permission but no Pro subscription, with `tier_enforcement_enabled` on → `UpgradePrompt` renders with "Pro Plan Required" + link to `/pricing`
5. Free user clicks the pricing link → navigates to `/pricing` (sanity check, no checkout flow)

### Group B — Hub navigation

6. Hub renders all 6 generation chips (gen-alpha, gen-z, gen-y, gen-x, gen-boomers, gen-silent) in the hero
7. Hub renders all 6 `GenerationCard` tiles with non-zero term counts (proves JSON imports succeeded)
8. Clicking a generation card navigates to `/apps/generations/<slug>` and renders the SlangApp
9. Topbar "Dashboard" link returns to `/`
10. AppNav contains all 6 generations as items

### Group C — Per-generation page + tabs

Run against one generation (gen-z by default; parameterize the spec so adding more is `for (const gen of GENERATIONS)`).

11. `/apps/generations/gen-z` renders generation header (emoji, name, era, term count, tagline)
12. Default tab is Dictionary
13. Switching to Translator hides Dictionary content, shows direction toggle + textarea
14. Switching to Quiz shows "Question 1 of 10" and 4 options
15. Switching to Trending shows ranked grid (#1 .. #20)
16. `/apps/generations/not-a-real-slug` → 404 (Next `notFound()`)

### Group D — Dictionary (search + category filter)

17. Search input filters term cards client-side (type a term known to exist in `gen-z.json`, list narrows to >=1 card containing that term)
18. Search by alias matches (term whose `aliases` includes the query)
19. Search with no matches renders the empty state ("No slang found for that search.")
20. Category pills include "all" + every distinct category in the JSON
21. Clicking a category pill filters to that category only; count line updates
22. Clicking "all" restores the full list
23. Term cards render: term, definition, example, vibe bar with score N/10, category badge

### Group E — Translator

24. Default direction is `English -> {Gen}`; toggle switches to `{Gen} -> English` and clears prior result
25. Empty input + Translate button → result reads "Type something first!"
26. Known phrase translation (e.g. on gen-z, input "this is good" -> result contains "it slaps", emphasized via `<strong>`)
27. Unknown input on `to-gen` → fallback line "Couldn't find common words to translate. Try terms like: ..."
28. Cmd/Ctrl+Enter in textarea triggers translate
29. `from-gen` direction decodes a known slang term back into a definition snippet
30. XSS guard: input `<script>alert(1)</script>` is escaped; no script executes (assert via `page.on("dialog")` never fires + result text contains literal "&lt;script&gt;" in the rendered HTML)

### Group F — Quiz

31. Quiz shows 10 questions (count progress dots)
32. Selecting an option disables the other options and reveals "Next" button
33. Selecting the correct definition marks the option green and increments score on Next
34. Selecting a wrong definition marks picked option red and the correct one green
35. After 10 questions, results screen shows score `X/10`, fluency percent, and a tier message ("Total Outsider" / "Needs Work" / "Getting There" / "Solid" / "Certified")
36. "Try Again" button resets to question 1 with a fresh question set (different term order is acceptable; just assert current=1 of 10)

### Group G — Trending

37. Trending grid renders 20 tiles (or `terms.length` if fewer than 20)
38. Tile #1 has the highest `vibeScore` for that generation (assert order matches a sort of the JSON, not a hard-coded term)
39. Each tile shows rank `#N`, term, and category badge

### Group H — Static params / SSG sanity

40. `generateStaticParams` produces all 6 generation slugs — assert by hitting each `/apps/generations/<slug>` and confirming 200 + correct header. One spec, six iterations. Catches a regression if a JSON file is removed without updating the registry list.

## 4. Spec organization

```
apps/web/tests/e2e/generations/
  access.spec.ts            # A — auth + tier gate + UpgradePrompt
  hub.spec.ts               # B — landing page navigation
  gen-page.spec.ts          # C, H — per-gen routing + tab switching + 404 + SSG sweep
  dictionary.spec.ts        # D — search + category filter
  translator.spec.ts        # E — direction toggle + translation + XSS escape
  quiz.spec.ts              # F — quiz state machine + results
  trending.spec.ts          # G — trending wall ordering
```

Each file: `beforeAll` seeds permission (and Pro subscription if needed) for the test user; no `afterEach` cleanup needed (no per-user data writes). Uses the shared `loggedInPage` fixture.

## 5. Selector strategy (do this before writing specs)

Today the components rely on text + a few `aria-` attributes; to keep tests stable against copy/style churn, add `data-testid` hooks to the high-traffic interactions in `slang-app.tsx`, `slang-dictionary.tsx`, `slang-translator.tsx`, `slang-quiz.tsx`, `generation-card.tsx`:

- `generation-hub`, `generation-card-${slug}`, `generation-chip-${slug}`
- `slang-app`, `tab-${dictionary|translator|quiz|trending}`, `tab-content-${...}`
- `dictionary-search`, `category-pill-${name}`, `dictionary-empty`, `term-card`, `term-card-title`, `term-card-vibe-score`
- `translator-direction-${to-gen|from-gen}`, `translator-input`, `translator-submit`, `translator-result`
- `quiz-progress-dot-${i}`, `quiz-question`, `quiz-option-${i}`, `quiz-next`, `quiz-result`, `quiz-score`, `quiz-restart`
- `trending-tile`, `trending-rank-${n}`

Small, surgical, and avoids querying by emoji/text.

## 6. Running

- `pnpm --filter web test:e2e` (existing script) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` already in `webServer.command` flow. Add `generations` to `APP_SELF_ENROLL_SLUGS` env in `playwright.config.ts` only if you decide to swap the explicit `seedPermission` call for self-enroll-on-first-visit. Default plan keeps the explicit seed.

## 7. Out of scope

- **Already covered by unit tests** in `apps/web/app/apps/generations/__tests__/`:
  - `gen-page.test.tsx` — per-generation page server-component rendering
  - `generation-card.test.tsx` — card markup
  - `layout.test.tsx` — `requireAccess` + `enforceFeatureTier` + `UpgradePrompt`
  - `slang-dictionary.test.tsx` — search/category filter logic
  - `slang-quiz.test.tsx` — quiz state machine
  E2E should cover the full UI→browser path (tab switching, real client-side filters, real DOM events) but should NOT re-assert pure component logic already locked down by Vitest.
- **Slang-translator unit tests** do not exist today — the e2e Group E carries the regression burden until a unit test is added. Note this in the PR.
- Visual regression (screenshot diff) — separate effort.
- Cross-browser matrix — `playwright.config.ts` is chromium-only; out of scope here.
- AI-assisted translator (the current translator is a static word map; if this gets replaced with an LLM call, revisit the rate-limit + mocking pattern from the Ideas plan's Group G).

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Add `seedProSubscription` helper to `tests/e2e/helpers/db.ts` (only if not already present — this is the first `tier: "pro"` app under e2e)
3. Write `access.spec.ts` first (highest value: it locks down the tier gate, which is the only thing unique to Pro apps)
4. Layer in `hub.spec.ts` + `gen-page.spec.ts` (covers routing surface)
5. Dictionary + Translator + Quiz + Trending in any order (independent client features)
