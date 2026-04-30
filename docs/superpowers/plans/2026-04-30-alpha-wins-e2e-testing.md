# Plan: E2E tests for the Alpha Wins app

> Drafted 2026-04-30. Slug `alpha-wins`, route `/apps/alpha-wins`, template `minimal`, tier `free`, auth required.

Reuse existing infra — Playwright config (`apps/web/playwright.config.ts`), the `loggedInPage` fixture (`apps/web/tests/e2e/fixtures/auth.fixture.ts`), and `seedPermission` (`apps/web/tests/e2e/helpers/db.ts`). No new helper file needed: Alpha Wins has **no DB persistence**. The page renders a static gallery from `apps/web/app/apps/alpha-wins/data/wins.json` via the client component `WinsGallery`. There is nothing for a service-role client to seed or assert against, which is why the Ideas plan's `helpers/<slug>.ts` step is intentionally absent here.

Component-level coverage already lives in `apps/web/app/apps/alpha-wins/__tests__/wins-gallery.test.tsx` (vitest + jsdom) and `__tests__/layout.test.tsx`. E2E only needs to prove the gated route + happy-path interactions work end-to-end through the real proxy + Auth0 + permission check.

---

## 1. Setup (one-time, prereq)

- **Env vars**: `E2E_TEST_USER_EMAIL/PASSWORD/ID` (already used by the auth fixture and `auth.spec.ts`); `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for `seedPermission`.
- **No new fixtures**: reuse `loggedInPage` and `unauthPage` from `auth.fixture.ts`.
- **Permissions**: `beforeAll` calls `seedPermission(userId, "alpha-wins", "view")` (registry permission is `"view"`, not `"edit"` — do not bump it). `afterAll` calls `deletePermission` to keep tests independent of the auth suite.
- **Self-enroll**: `alpha-wins` is `tier: "free"`, so `setSelfEnrollTierResolver` already lets the auth fixture's user self-enroll in dev mode. CI runs `next start`, so the test still seeds explicitly rather than relying on `APP_SELF_ENROLL_SLUGS` (which only lists `command-center,standup`).

## 2. Test data strategy

**None.** Wins ship in `data/wins.json` and are statically imported. Tests reference real win names from that file (e.g. `"Wins Channel — Share What You Build"`, `"Morning Weather Briefing"`) so we exercise the actual production payload, not a mock. If the file changes, the spec changes — that is the right coupling for a content-driven gallery.

## 3. Use-case catalog (test inventory)

### Group A — Access, gating, and core gallery interactions (smoke)

1. **Unauth → login redirect.** `unauthPage` visits `/apps/alpha-wins`; expect redirect to `/auth/login` (or Auth0 universal login URL). Mirrors `auth.spec.ts` pattern.
2. **Auth user without `alpha-wins` permission → unauthorized.** Delete the permission first, then `loggedInPage.goto`; expect `/unauthorized` (free tier auto-enroll only fires on the dev path; in `next start` we should land on unauthorized when permission is absent and self-enroll is off).
3. **Auth user with `view` permission → page renders.** Header shows `"Alpha Wins"` and the subtitle `"Recent wins & accomplishments"`. The win-count badge (`{n} wins`) reflects `wins.json.length`.
4. **Search filters the grid.** Type `"weather"` in the `Search wins…` input → `"Morning Weather Briefing"` is visible, `"Wins Channel — Share What You Build"` is not. Win-count badge updates to `1 win` (singular — guards the pluralization branch).
5. **Search empty state.** Type `"zzznomatch"` → `"No wins match that filter"` renders.
6. **Integration filter pill.** Click the `Slack` integration pill → grid narrows to wins whose `integrations` include Slack. Both seeded wins match, so we use a more selective filter when the dataset grows; today this asserts the filter pill is clickable and stays selected (accent style).
7. **Category filter pill.** Click the `Workflow` category pill → only `type === "Workflow"` wins remain. Combined with #6, asserts the category-and-integration composition logic that the unit test already covers, but through the real route.
8. **Open detail modal.** Click a win card → `role="dialog"` opens, title contains the win name, `"Setup Prompt"` section is present, and the `📋 Copy Prompt` button is rendered. Closing via Escape returns focus to the grid.

That is the entire Group A. There is no Group B (no CRUD), no Group C/D/E (no status/snooze/sort), no Group G (no AI). Adding more groups would be padding — the unit tests in `__tests__/wins-gallery.test.tsx` already cover deeper filter composition, copy-to-clipboard, and empty-gallery edge cases at speed; e2e duplicating them adds flake without coverage.

## 4. Spec organization

```
apps/web/tests/e2e/alpha-wins/
  access.spec.ts   # cases 1–3 (gating)
  gallery.spec.ts  # cases 4–8 (search, filters, modal)
```

Two files instead of one because the `beforeAll`/`afterAll` permission lifecycle differs: `access.spec.ts` toggles permission state mid-suite (case 2 deletes, case 3 re-seeds), while `gallery.spec.ts` keeps a stable seeded permission throughout. Splitting avoids leaking state between concerns.

## 5. Selector strategy

The component currently relies on text + a couple of `aria-label`s (`"Filter by category"`, `"Filter by integration"`). For the eight cases above, text + role selectors are stable enough — win names come from `wins.json` and rarely change, and pill buttons are queryable by `getByRole("button", { name: "Slack" })`. No `data-testid` additions required for this scope. If we later add CRUD or surface admin tooling, revisit then.

Why no testids now: adding hooks for a static gallery of two cards is over-engineering. The unit test file uses identical selector patterns (`getByRole("button", { name: ... })`) and has been stable.

## 6. Running

- `pnpm --filter web test:e2e` — same script the Ideas plan and `auth.spec.ts` use.
- Local: `reuseExistingServer: true` lets `pnpm dev` stay running between iterations.
- CI: relies on `next build && next start` from `webServer.command`. Permission seeding must run before the page is fetched (already handled by `beforeAll`).

## 7. Out of scope

- Visual diffs of the glass-card hover/translate state — separate effort.
- Verifying clipboard contents end-to-end (Playwright clipboard permissions are flaky across browsers; the unit test already mocks and asserts `clipboard.writeText` directly).
- Re-asserting category/integration filter composition matrices — `wins-gallery.test.tsx` does this exhaustively.

---

## Execution order

1. Write `access.spec.ts` (cases 1–3) — proves gating works, highest signal for routing/auth regressions.
2. Write `gallery.spec.ts` (cases 4–8) — exercises the user-facing happy path through the real proxy.
3. Run both locally with seeded perms; confirm tear-down leaves `app_permissions` clean.
