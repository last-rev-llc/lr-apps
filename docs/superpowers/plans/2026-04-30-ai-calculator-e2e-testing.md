# Plan: E2E tests for the AI Calculator app

> Drafted 2026-04-30. Pattern follows `2026-04-30-ideas-e2e-testing.md`.

AI Calculator is a **hybrid public/gated app**: registry entry has `publicRoutes: ["/"]` so the landing at `/apps/ai-calculator` is open to anonymous traffic, while the actual tool lives at `/apps/ai-calculator/calculator` under a `(protected)` segment that calls `requireAccess("ai-calculator")`. `postEnrollPath: "calculator"` means the unauthorized self-enroll form action redirects new users to `/apps/ai-calculator/calculator` (not the root) on success. Both paths must be covered. `template: "minimal"` and `tier: "free"` — keep this tight.

Vitest unit tests already exist in `apps/web/app/apps/ai-calculator/__tests__/` (page render, `calculate()` math, protected-layout gate). E2E covers what those can't: the proxy/middleware/registry wiring, the redirect chain, and the `leads` insert against a real Supabase.

---

## 1. Setup (one-time, prereq)

- **Env vars** (already wired by existing E2E infra — no new secrets):
  - `E2E_TEST_USER_EMAIL` / `_PASSWORD` / `_ID` — reused via `loggedInPage` fixture.
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for `db.ts` permission helpers and `leads` table assertions.
- **`APP_SELF_ENROLL_SLUGS`** in `playwright.config.ts` `webServer.env` must include `ai-calculator` so Group A test 4 (self-enroll → postEnroll redirect) works under `next start` in CI. Free-tier apps auto-allow self-enroll at runtime via `setSelfEnrollTierResolver`, but the explicit list is what `playwright.config.ts` documents — append `ai-calculator` to keep it self-evident.
- **No new fixtures**: `loggedInPage` and `unauthPage` from `auth.fixture.ts` are sufficient. The unauth path is critical here (the public landing is the first app in the registry that needs an unauthenticated assertion).

## 2. Test data strategy

Add a small helper `tests/e2e/helpers/leads.ts` with:

- `deleteLeadsByEmail(email)` — `from("leads").delete().eq("email", email)`. Called in `afterEach` so the lead-capture spec is repeatable.
- `getLeadByEmail(email)` — single-row read, returns `{ source, data } | null` for assertions.

Why DB-direct: the lead-capture form has a graceful fallback that shows "success" UI even on insert failure (see `(protected)/calculator/page.tsx` `handleLeadSubmit` catch block). Without a DB read the test would pass on a broken insert. The DB read is the contract.

No seeding helper needed — there is no per-user calculator state. The protected calculator is stateless aside from the leads insert.

## 3. Use-case catalog (test inventory)

### Group A — Access & gating (smoke; required dual coverage)

1. **Unauth on public landing renders** — `unauthPage.goto("/apps/ai-calculator")` returns 200, h2 "AI ROI Calculator" visible, "Open ROI calculator" CTA present. Confirms `publicRoutes: ["/"]` is honored by `requireAppLayoutAccess` and the registry `isPublicRoute` matcher.
2. **Unauth on `/calculator` redirects to login** — `unauthPage.goto("/apps/ai-calculator/calculator")` lands at `/login` (proxy/auth0). Confirms the `(protected)` layout's `requireAccess("ai-calculator")` is wired and the public-route allowlist does NOT bleed into the subpath.
3. **Authed without permission on `/calculator` → `/unauthorized?app=ai-calculator`** — start clean (`deletePermission`), `loggedInPage.goto("/apps/ai-calculator/calculator")`, expect URL to match `/unauthorized` with the slug query param.
4. **Self-enroll → postEnroll redirect lands at `/calculator`, not root** — from the unauthorized page, click "Get access". Server action `requestAppAccess` reads `app.postEnrollPath` and redirects to `/apps/ai-calculator/calculator`. Assert URL matches `/apps/ai-calculator/calculator` (not bare `/apps/ai-calculator`). DB row `app_permissions` is now `view`. This is the load-bearing test for `postEnrollPath` — no other app exercises it in E2E today.
5. **Authed with `view` permission renders calculator** — seed `view`, `goto("/apps/ai-calculator/calculator")`, expect "Your Projected AI Savings" card (auto-calculated from defaults via `useEffect`).
6. **Authed user on public landing renders the same as unauth** — landing doesn't gate; ensures no accidental redirect for signed-in users hitting `/`.

### Group B — Calculator interaction (the gated tool)

7. **Default inputs auto-render results** — on first paint of `/calculator`, results card with "Hours Saved / Year", "Annual Cost Savings", "Projected ROI" stat boxes are visible. Guards the `useEffect` initial-calculate path.
8. **Change inputs + click "Calculate My ROI" updates the breakdown** — fill team=10, meetings=5, manual=10, hourly=50; click button; assert breakdown row "Total hours saved/year" reads "2,750 hrs" (matches the unit test). One assertion is enough — math is unit-tested in `__tests__/calculator.test.tsx`.
9. **Methodology card sources are external links with `target="_blank"`** — quick a11y/regression check on the four source links (McKinsey/Stanford/Deloitte/Gartner). Cheap and stable.

### Group C — Lead capture (the only DB write)

10. **Submit invalid email → inline error, no DB row** — type "not-an-email" into the email field, click "Get My Report", expect red error text "Please enter a valid email address." `getLeadByEmail` returns null.
11. **Submit valid email → success message + DB row with `source: "ai-calculator"` and `data` payload** — fill name + unique email (`e2e+${Date.now()}@example.com`), submit. Expect green "Thanks!" copy. `getLeadByEmail` returns row where `source === "ai-calculator"` and `data` includes the four input fields. Cleanup in `afterEach` via `deleteLeadsByEmail`.
12. **Submit while loading is disabled** — click submit, immediately assert button reads "Sending..." and is `disabled`. Guards against double-submit.

> Note: the page's `catch` block masks insert errors as a fake success. Test 11 specifically asserts the **DB row exists** so a regression that breaks the insert (e.g. `leads` table schema drift, RLS misconfig) won't pass. This is the single most important test in the file.

### Group D — Cross-app routing sanity (optional, 1 test)

13. **Subdomain shape**: `app.subdomain` is `calculator`. If the existing `subdomain-routing.spec.ts` parameterizes over registry slugs, this is auto-covered — verify before adding. If not, add one assertion that `calculator.<host>` proxies to `/apps/ai-calculator`. Skip if redundant.

## 4. Spec organization

```
apps/web/tests/e2e/ai-calculator/
  access.spec.ts        # A1–A6 (unauth public, unauth gated, self-enroll → /calculator)
  calculator.spec.ts    # B7–B9
  leads.spec.ts         # C10–C12 (uses helpers/leads.ts)
```

Three files, ~12 tests. Matches `template: "minimal"` — no AI-plan, no view-modes, no filters to test.

Each file: `beforeAll` seeds permission where needed; `afterEach` cleans permission and (for `leads.spec.ts`) deletes the lead row by email. All use `loggedInPage` except `access.spec.ts` tests 1 + 2 which use `unauthPage`.

## 5. Selector strategy

Page already has stable hooks:
- Inputs use `id` (`teamSize`, `meetingHours`, `manualHours`, `hourlyCost`) → `getByLabel(/Team Size/)`.
- Buttons have stable copy ("Calculate My ROI", "Get My Report", "Open ROI calculator").
- Lead form inputs have `placeholder="Work email"` and `placeholder="Your name"`.

No `data-testid` work needed before specs — the surface is small enough that role/label selectors are stable. (Contrast with Ideas, where the grid of cards demanded testids.)

## 6. Running

- `pnpm --filter web test:e2e` (or whatever script the repo standardizes on; check `apps/web/package.json` and add if missing).
- Local: dev server reused; CI does `next build && next start`.
- Add `ai-calculator` to `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts` `webServer.env` (see §1) before merging — the self-enroll test will fail in CI otherwise even though it works locally (NODE_ENV=development opens self-enroll for everything).

## 7. Out of scope

- `calculate()` math: already exhaustively unit-tested in `__tests__/calculator.test.tsx`. E2E asserts the wiring (one input change → one DOM update), not arithmetic.
- Vitest landing-page render tests in `__tests__/page.test.tsx`: don't duplicate; E2E covers the **registry/proxy/middleware** chain that those mocks bypass.
- Visual regression / screenshots: separate effort.
- Lead email delivery: there is no email send today; the catch block silently succeeds. If/when email is added, gate that behind a `RESEND_API_KEY` env check and add a dedicated test.

---

## Execution order

1. Add `ai-calculator` to `APP_SELF_ENROLL_SLUGS` in `playwright.config.ts` — one-line change, unblocks A4.
2. Add `tests/e2e/helpers/leads.ts` (two functions, ~30 LOC).
3. Write `access.spec.ts` first — highest value, validates the dual public/gated registry contract that no other app exercises.
4. Write `calculator.spec.ts` (smoke) and `leads.spec.ts` (the load-bearing DB assertion).
