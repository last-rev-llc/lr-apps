# Plan: E2E tests for the Roblox Dances app

> Seed for `alpha-plan`. Drafted 2026-04-30.

The infrastructure already exists — `apps/web/playwright.config.ts`, the `loggedInPage` fixture in `tests/e2e/fixtures/auth.fixture.ts`, and `seedPermission` in `tests/e2e/helpers/db.ts`. We reuse it as-is. No new fixture is needed.

Roblox Dances is a `template: "minimal"`, `tier: "free"`, `auth: true` app at `/apps/roblox-dances` (registry slug `roblox-dances`, `permission: "view"`). It has three tabs — **Catalog** (read-only browse/filter/search + a Lua code-viewer modal with a local-only star rating), **Submit** (writes to `dance_submissions` via the browser Supabase client, hard-coded `submitted_by: "anonymous"`), and **Generator** (pure client-side template-based Lua generator — no network, no DB). There are **no server actions, no edit/delete flows, and no migration** for the `dances` / `dance_submissions` tables yet — `getDances()` / `getDanceSubmissions()` swallow the "table does not exist" error and return `[]`. That shape drives every choice below.

---

## 1. Setup (one-time, prereq)

- **Env vars** (already used elsewhere — no new ones):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Permission seeding**: `beforeAll` calls `seedPermission(userId, "roblox-dances", "view")` so the layout's `requireAppLayoutAccess("roblox-dances")` lets the test user through. `afterAll` deletes it for hygiene. `view` (not `edit`) — the registry declares `permission: "view"` and there is no edit-gated UI to exercise.
- **No second user / no entitlement fixture**: this is `tier: "free"` with no billing-gated buttons, so we don't need the second-user pattern from the Ideas plan.

## 2. Test data strategy (and why there is no helper)

**No `tests/e2e/helpers/roblox-dances.ts`.** Unlike Ideas, this app has no per-user persistence we need to assert against:

- `dances` is a read-only catalog (no UI to insert) — and the table may not exist locally; queries already tolerate that and return `[]`.
- `dance_submissions` rows have `submitted_by: "anonymous"` hard-coded in the client, so they aren't user-scoped — there is nothing to seed-per-user or clean-up-per-user. Submissions persist if the table exists, and are simply skipped when it doesn't.
- Star ratings on cards are React state only (`localRatings`), never written back.

If a future change adds real user-scoped persistence, add the helper then. For now, asserting on the rendered DOM after a UI submit is sufficient and avoids coupling the suite to optional schema.

The trade-off: when the `dance_submissions` table is absent, the `submit` happy-path test asserts the optimistic UI append (the component pushes the new submission into local state regardless of the network result) and the toast. That's the right contract — it matches what a user actually sees.

## 3. Use-case catalog (test inventory)

Group A only — this app has minimal surface area; padding to 5+ groups would be invented work.

### Group A — Smoke + happy paths (single file)

1. Unauth user → `/apps/roblox-dances` redirects to login
2. Auth user without `roblox-dances` permission → unauthorized page (guards `requireAppLayoutAccess`)
3. Auth user with `roblox-dances:view` → page renders, header "🕺 Roblox Dance Marketplace" visible, three tab triggers present (Catalog, Submit, Generator)
4. Catalog tab: search input narrows the grid (type a known seeded name OR — if the table is empty — assert the "No dances match your filters" empty state appears unchanged, since both branches confirm the filter wires up)
5. Catalog tab: difficulty `<select>` changing to `expert` filters cards (skipped when seed list is empty — `test.skip` with reason)
6. Catalog tab: clicking a card opens the code-viewer dialog with the dance name in the title (skipped when seed list is empty)
7. Submit tab: clicking "Submit Dance Idea" with empty name shows the "Please enter a dance name" toast and does not append to the submissions list
8. Submit tab: filling name + description + clicking submit → new card appears at the top of "Recent Submissions" with status badge `pending` and the toast "Dance idea submitted!" — relies on optimistic UI, so it passes whether or not the `dance_submissions` table exists
9. Generator tab: empty prompt → "Generate Script" button is disabled
10. Generator tab: typing a prompt + clicking generate → after the simulated 800ms delay, a `generated.lua` code block renders containing `local RunService = game:GetService("Players")`-style Motor6D scaffolding (assert on a stable substring like `Motor6D Procedural Animation`)

That's 10 cases. Roughly one-third the size of the Ideas plan (38 cases) — appropriate for a `minimal` app with no CRUD, no server actions, no entitlements, and three tabs of which two are read-only-or-client-only.

## 4. Spec organization

```
apps/web/tests/e2e/roblox-dances/
  smoke.spec.ts    # Group A — all 10 cases, one file
```

A single file is correct here because the cases are short, share the same `beforeAll` permission seed, and don't need cross-file isolation. `afterEach` is a no-op (no per-user state to reset).

## 5. Selector strategy (do this before writing the spec)

The component currently relies on text + emoji. Two surgical `data-testid` additions in `components/dance-app.tsx` keep the spec stable without rewiring the UI:

- `dance-tabs`, `dance-tab-${catalog|submit|generator}` on `Tabs` / `TabsTrigger`
- `dance-search-input`, `difficulty-select`, `sort-select` in `CatalogTab`
- `dance-card-${id}`, `code-viewer-dialog` for the modal flow
- `submit-name-input`, `submit-desc-textarea`, `submit-button`, `submission-card` in `SubmitTab`
- `generator-prompt`, `generate-button`, `generated-code` in `GeneratorTab`
- `dance-toast` on the toast div (currently keyed by visible text — fine to also assert on text, but a stable hook avoids flakes if copy moves)

Avoid querying by emoji (`🕺`, `📝`) — emoji glyphs in selectors are a known source of cross-platform brittleness.

## 6. Running

- `pnpm --filter web test:e2e` (existing script)
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `playwright.config.ts` already runs `pnpm dev`. **Add `roblox-dances` to `APP_SELF_ENROLL_SLUGS`** in `webServer.env` (currently `command-center,standup`) OR rely solely on `seedPermission` — the latter is preferred because it doesn't widen the production self-enroll surface.

## 7. Out of scope

- Vitest coverage already exists at `apps/web/app/apps/roblox-dances/__tests__/{dance-app,layout,page}.test.tsx` — those mock `@repo/ui` and `@repo/db/client` and cover render/filter/empty-state. E2E does **not** duplicate them; it covers only auth gating, the real DOM-level submit happy path, and the generator output shape (which the Vitest mocks cannot meaningfully assert because the 800ms timer + clipboard call are mocked away).
- The Lua syntax-highlighting markup (`highlightLua`) — better as a unit test than a Playwright assertion.
- `dance_submissions` row-shape assertions in DB — deferred until a migration exists and the component switches off `submitted_by: "anonymous"`.
- Visual regression / screenshot diff — separate effort.

---

## Execution order

1. Add the `data-testid` hooks (§5) — small no-behavior-change PR.
2. Write `apps/web/tests/e2e/roblox-dances/smoke.spec.ts` covering all 10 cases. `test.skip(condition, reason)` on cases 5 and 6 when the seeded catalog is empty so the suite stays green pre-migration.
3. Confirm CI permission flow: `seedPermission(userId, "roblox-dances", "view")` in `beforeAll`, mirror delete in `afterAll`.
