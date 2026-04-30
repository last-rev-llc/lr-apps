# Plan: E2E tests for the Meeting Summaries app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Existing infra is solid — Playwright is configured at `apps/web/playwright.config.ts`, there's an Auth0 `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`) with storageState, and a Supabase-service-role DB helper (`tests/e2e/helpers/db.ts`) for seeding permissions. We extend, not replace.

**Notable shape of this app vs. Ideas:** Meeting Summaries is a **read-only viewer** over the `zoom_transcripts` table. There is no `__tests__/actions.test.ts`, no server actions, no insert/edit/delete UI — the page calls `getMeetings()` only. No migration for `zoom_transcripts` lives in `supabase/migrations/`; the table is populated externally (by an upstream Zoom-sync pipeline) and the registry entry is `permission: "view"` rather than `"edit"`. Consequence: **no Group B (CRUD)**, and the "mark done" interaction in the Action Items tab is **client-only state** (a `Set<string>` in `useState`), so it does not survive reloads and must be asserted as such — not against the DB.

---

## 1. Setup (one-time, prereq)

- **Env vars** (`.env.local` for local, GH secrets for CI):
  - `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_TEST_USER_ID` — already used by auth fixture
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already used
- **No new fixtures**: reuse `loggedInPage` from `auth.fixture.ts`.
- **Permissions**: in `beforeAll`, call `seedPermission(userId, "meeting-summaries", "view")` so the test user can reach `/apps/meeting-summaries`. Tear down after. (`view` matches the registry entry; the layout's `requireAppLayoutAccess("meeting-summaries")` accepts any seeded permission.)

## 2. Test data strategy (the work that doesn't exist yet)

Add `tests/e2e/helpers/meeting-summaries.ts` with service-role helpers that **directly seed `zoom_transcripts`**. We seed via service role because (a) the app exposes no write API, and (b) reaching the "mixed sentiment / mixed priority / one un-summarized / one old" starting state through any UI is impossible.

- `seedMeeting(partial?: Partial<ZoomTranscript>): Promise<ZoomTranscript>` — single insert, returns row. Why a stand-alone seeder (not user-scoped): `zoom_transcripts` has no `user_id` column; the table is global. Tests must therefore use **highly unique topics** (e.g. `e2e-${Date.now()}-${randomSuffix}`) and filter by topic when asserting, to avoid colliding with real data on shared dev/staging DBs.
- `seedMeetings(specs: Partial<ZoomTranscript>[]): Promise<ZoomTranscript[]>` — bulk for fixture setup.
- `deleteMeetingsByTopicPrefix(prefix: string)`: cleanup. Why prefix-based: see above — there is no per-user scoping, so we delete only rows we created.
- `getMeetingById(id)`: read-back assertions where needed.

Why DB-direct seeding (not UI): there is **no UI to create** a meeting. Period.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke)

1. Unauth user → `/apps/meeting-summaries` redirects to login
2. Auth user without `meeting-summaries` permission → unauthorized page
3. Auth user with `meeting-summaries:view` permission → page renders with header `📝 Meeting Summaries` (in layout) and `Meeting Summaries` (in `PageHeader`)
4. Stat cards render with correct counts (Meetings, Summarized, Action Items, Hours) given seeded fixtures — guards the `computeStats` server-rendered path

### Group C — Summaries tab

5. Meeting list renders all seeded rows in date-desc order (matches `getMeetings()` ORDER BY `start_time` DESC)
6. Click a meeting card → expands to show Summary, Decisions, Action Items, Topics, Attendees
7. Click again → collapses
8. Meeting with `summary === null` → shows "⏳ pending" badge **and** the "Summary not yet generated" body when expanded
9. SentimentBadge renders for `productive`/`tense`/`neutral`; absent when `sentiment` is undefined
10. `client_id` pill renders when present, omitted when null
11. Empty state (`No meetings found`) when search/range yields zero rows

### Group D — Search & date-range filtering (Summaries)

12. Search by topic → list narrows to matches
13. Search by `client_id` → only matching meetings remain
14. Search by attendee name → only meetings with that attendee
15. Search by summary text → matches text body
16. Range pill `Last 7 days` → meetings older than 7 days hidden; toggle indicator highlights active pill
17. Range pill `Last 30 days` (default) → 30-day cutoff applied
18. Range pill `Last 90 days` → 90-day cutoff applied
19. Range pill `All` → every seeded row visible regardless of `start_time`
20. Range + search combine (AND) — narrows on both axes simultaneously

### Group E — Action Items tab

21. Switch to `⚡ Action Items` tab → action items from **all** meetings flatten into one list (denormalized via `_meetingTopic` etc.)
22. Each card shows owner, priority pill (correct color for high/medium/low), deadline, source-meeting label, client_id (when present)
23. Status filter `All` → shows both open and done items
24. Status filter `Open` (default) → hides items with `done: true` or `status === "done"`
25. Status filter `Done` → only done items, including ones marked done in this session
26. Priority filter `High`/`Medium`/`Low` → narrows to matching priority; defaults to `medium` when priority unset
27. Search within actions filters by action text, owner, and source meeting topic
28. Empty state (`No action items found`) when filters yield zero
29. Click `✅ Done` → card opacity drops, button disables, item disappears from `Open` filter, appears in `Done` filter — **client-only state, NOT persisted to DB** (assert by reload: item returns to its original status)
30. Click `📧 Generate Follow-up` → button text becomes `📋 Copied`, returns to original after ~2s; clipboard contains `/followup ${owner}: ${text} (from ${meetingTopic})`. Use Playwright's `context.grantPermissions(["clipboard-read"])` to read it back.

### Group F — Tab persistence / regression

31. Default tab on load is `Summaries` (the `defaultValue="summaries"` on `<Tabs>`)
32. Switching tabs preserves state per tab: search input value in Summaries tab survives a round-trip to Action Items and back

### Group H — A11y / regression

33. Tabs reachable via keyboard: arrow keys move between `Summaries` and `Action Items` triggers; Enter activates
34. Card expand button is a `<button>` and toggles via Enter/Space
35. Clipboard fallback: in browsers/contexts where `navigator.clipboard.writeText` rejects, button still flips to "📋 Copied" (the component swallows the error). Test by stubbing `navigator.clipboard` to a rejecting mock — guards against silent regression of the `.catch(() => {})`.

## 4. Spec organization

```
apps/web/tests/e2e/meeting-summaries/
  access.spec.ts             # A
  summaries-tab.spec.ts      # C
  search-filter.spec.ts      # D
  action-items.spec.ts       # E
  tabs.spec.ts               # F
  a11y.spec.ts               # H
```

Each file: `beforeAll` seeds permission + a deterministic fixture set (3–4 meetings covering the matrix below); `afterAll` deletes via topic prefix; uses the shared `loggedInPage` fixture.

**Fixture matrix** (one row per concern → keeps specs orthogonal):

| topic prefix              | summary | sentiment   | client_id | attendees       | action_items                                     | start_time   |
| ------------------------- | ------- | ----------- | --------- | --------------- | ------------------------------------------------ | ------------ |
| `e2e-{ts}-sprint`         | yes     | productive  | acme      | Alice, Bob      | 2× (one high open, one medium open)              | now − 1d     |
| `e2e-{ts}-design`         | yes     | neutral     | beta      | Carol, Dave     | 1× (low, done)                                   | now − 5d     |
| `e2e-{ts}-pending`        | null    | undefined   | undefined | []              | []                                               | now − 10d    |
| `e2e-{ts}-old-kickoff`    | yes     | tense       | acme      | Alice           | 1× (high, owner=Alice)                           | now − 60d    |

This matrix exercises every branch in `parseJsonField`, both sentiment cases with the `?? neutral` fallback, the `undefined client_id` skip, the `pending` badge, the 30-day default cutoff (old-kickoff hidden until `All`), and the per-priority filter.

## 5. Selector strategy (do this before writing specs)

The component currently relies on text + emoji + `placeholder` only. Add `data-testid` hooks before writing specs:

In `meetings-app.tsx`:
- `meeting-card`, `meeting-card-${id}`, `meeting-card-toggle`, `meeting-card-pending-badge`, `meeting-card-sentiment`, `meeting-card-client-id`
- `meeting-summary`, `meeting-decisions`, `meeting-action-items`, `meeting-topics`, `meeting-attendees`
- `summaries-search-input`, `summaries-range-${7|30|90|all}`
- `tab-summaries`, `tab-actions`
- `actions-search-input`, `action-status-${all|open|done}`, `action-priority-${all|high|medium|low}`
- `action-item`, `action-item-${meetingId}-${idx}`, `action-item-mark-done`, `action-item-followup`, `action-item-followup-copied`
- `meetings-empty-state`, `actions-empty-state`

In `page.tsx`:
- `stat-card-meetings`, `stat-card-summarized`, `stat-card-action-items`, `stat-card-hours` (or rely on `StatCard` already exposing labels)

Small, surgical, avoids querying by emoji/text. Tests should never match on `📝` / `⚡` / `✅` etc., because the design system may swap glyphs.

## 6. Running

- `pnpm --filter web test:e2e` (add script if missing) → `playwright test`
- Local: dev server is reused (`reuseExistingServer: !CI`)
- CI: `next build && next start` is the `webServer.command` flow. `meeting-summaries` does **not** need to be added to `APP_SELF_ENROLL_SLUGS` because the test seeds the permission directly via service role.

## 7. Out of scope

- Component unit tests already cover `MeetingsApp` interactions (`__tests__/meetings-app.test.tsx`), the layout (`__tests__/layout.test.tsx`), and the page (`__tests__/page.test.tsx`). E2E covers only the **render → permission → DB → UI** path and clipboard, not branch coverage of every filter combination already proven in jsdom.
- The Zoom-sync pipeline that populates `zoom_transcripts` is upstream of this app — its tests live with that pipeline.
- Visual regression (screenshot diff) — separate effort.
- Persisting "mark done" — feature does not exist; tests assert the **opposite** (state lost on reload) so we catch a future regression that quietly persists wrong state.

---

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change
2. Add `tests/e2e/helpers/meeting-summaries.ts` — DB seed/cleanup keyed on topic prefix
3. Write `access.spec.ts` + `summaries-tab.spec.ts` first (highest value, lowest flake risk)
4. Layer in D/E
5. Tabs + a11y/clipboard regression last
