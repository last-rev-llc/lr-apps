# Plan: E2E tests for the Ideas app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `E2E_TEST_USER_PRO_EMAIL/PASSWORD/ID` — second user for `ideas:ai-plan` entitlement tests
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`; specs that exercise the upgrade flow get a second context loaded with a different `storageState` file.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "ideas", "edit")` so the test user can reach `/apps/ideas`. Tear down after.

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/ideas.ts` with service-role helpers:

- `seedIdea(userId, partial?: Partial<IdeaRow>): Promise<Idea>` — inserts directly, returns row
- `seedIdeas(userId, count, factoryFn?)` — bulk
- `getIdea(id)`, `listIdeasForUser(userId)` — assertions read DB to confirm server actions actually persisted
- `deleteIdeasForUser(userId)` — cleanup; called in `afterEach` to keep tests independent

Why DB-direct seeding (not UI): reaching a "5 ideas with mixed status/rating/snooze" starting state through the UI is slow and brittle.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/ideas` redirects to login
2. Auth user without `ideas` permission → unauthorized page
3. Auth user with `ideas:edit` permission → page renders with header "💡 Ideas"
4. User without `ideas:ai-plan` entitlement → clicking "✨ Plan & score with AI" opens upgrade dialog
5. User with `ideas:ai-plan` entitlement → button does not show upgrade dialog

### Group B — Create / Edit / Delete (CRUD)

6. Open "+ New Idea" modal → modal renders centered, title field empty
7. Submit empty title → inline error "Title is required", no DB row
8. Create with title only → row appears in grid, persisted in DB
9. Create with full payload (title/description/category/tags/sourceUrl) → all fields persisted, tags parsed CSV
10. Open edit modal on existing idea → fields populated, including feasibility/impact/effort
11. Edit and save → DB updated, optimistic UI refresh
12. Cancel edit → no DB write, modal closes
13. Delete via row menu → confirm dialog → DB row removed

### Group C — Status & rating

14. Status dropdown change (new → in-progress) → persisted, visible in card
15. Star rating click 4 stars → persisted, score updates
16. Click same star count twice → rating clears to 0/null
17. Optimistic-update rollback on server error (mock failure)

### Group D — Hide / Snooze

18. Hide via "✕" → idea moves out of "Active" view, lands in "Hidden (n)" filter
19. Restore from hidden → returns to active
20. Snooze 1 week → idea moves to "Snoozed", `snoozedUntil` set
21. "Show Now" from snooze menu → returns to active
22. Snoozed indicator/opacity rendered

### Group E — Filtering, sorting, search

23. Search by title → list narrows
24. Search by tag → matched
25. Search empty state when no match → EmptyState renders
26. Quick filter "Needs Rating" → only unrated rows
27. Quick filter "Quick Wins" → feasibility ≥ 7 + Low effort
28. Quick filter "Top Rated" → sorted by rating desc
29. Quick filter "New Today" → only items created < 24h
30. Category pill (Product) → only Product rows
31. Sort by Rating, toggle asc/desc → arrow indicator + order
32. Show filter Snoozed/Completed/Hidden/All counts match

### Group F — View modes

33. Toggle list view → list rows render with same actions
34. Toggle back to grid → cards render

### Group G — AI plan

35. With entitlement: trigger plan on an idea → plan section populates (mock the model OR run against fixed prompt with stable assertion targets like `data-testid="plan-caption"`)
36. Rate-limited path → user-visible error after N invocations (matches `RateLimitedError`)

### Group H — A11y / regression

37. Modal centering computed-style assert (the bug fixed 2026-04-30) — guards against Tailwind scan regressions
38. Keyboard: Esc closes modal, Tab order through form

## 4. Spec organization

```
apps/web/tests/e2e/ideas/
  access.spec.ts           # A
  crud.spec.ts             # B
  status-rating.spec.ts    # C
  hide-snooze.spec.ts      # D
  filters-search.spec.ts   # E
  views.spec.ts            # F
  ai-plan.spec.ts          # G (gated by entitlement env)
  modal-centering.spec.ts  # H37 — explicit regression guard
```

Each file: `beforeAll` seeds permission + fixture data; `afterEach` clears that user's ideas; uses the shared `loggedInPage` fixture.

## 5. Selector strategy (do this before writing specs)

Currently the components rely on text + a couple of `aria-label`s. To keep tests stable as copy/styles change, add `data-testid` hooks to the high-traffic interactions in `ideas-app.tsx`, `idea-form-modal.tsx`, `row-menu.tsx`, `status-dropdown.tsx`:

- `idea-card`, `idea-card-title`, `idea-card-score`
- `new-idea-button`, `idea-form`, `idea-form-title-input`, `idea-form-submit`
- `quick-filter-${key}`, `category-pill-${name}`, `show-filter-${key}`, `sort-${key}`
- `view-toggle-${grid|list}`
- `snooze-menu`, `snooze-${1d|1w|2w|1mo|show}`
- `hide-button`, `restore-button`, `delete-confirm`

Small, surgical, and avoids querying by emoji/text.

## 6. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` already in `webServer.command` flow — note `APP_SELF_ENROLL_SLUGS` env may need `ideas` added so the test user can self-enroll, OR rely on `seedPermission`

## 7. Out of scope

- Server-action unit tests already exist in `apps/web/app/apps/ideas/__tests__/actions.test.ts` — don't duplicate; e2e covers the UI→action→DB happy paths only
- Visual regression (screenshot diff) — separate effort

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Add `tests/e2e/helpers/ideas.ts` — DB seed/cleanup
3. Write `access.spec.ts` + `crud.spec.ts` first (highest value, lowest flake risk)
4. Layer in C/D/E/F
5. AI plan + modal-centering regression last
