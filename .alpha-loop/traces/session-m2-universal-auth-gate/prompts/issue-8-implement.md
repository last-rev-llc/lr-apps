Implement GitHub issue #8: Update login/signup flows for universal auth

## Summary
Update the auth hub login/signup flows to support universal auth gate. Ensure redirect-after-login works for all 27 apps, update unauthorized page, and add self-enroll support.

## Acceptance Criteria
- [ ] Redirect-after-login preserves original app subdomain for all 27 apps
- [ ] Unauthorized page shows the app name and a "request access" CTA
- [ ] Self-enroll support: apps in `APP_SELF_ENROLL_SLUGS` auto-grant `view` on first login
- [ ] `APP_SELF_ENROLL_SLUGS` env var documented and configurable
- [ ] Login flow handles edge cases: expired sessions, invalid redirects, unknown apps
- [ ] Signup flow redirects to my-apps after email confirmation
- [ ] All 14 already-gated apps have registry entry updated to `auth: true`


## Implementation Plan
Step 1 — Validate redirects in auth-login-redirect.ts: buildAuthLoginHref should fall back to /my-apps when redirectSlug is provided but doesn't match any known app (unknown app guard). Log a warning for traceability.

Step 2 — Harden auth0-factory.ts onCallback: (a) Validate returnTo is a same-origin relative path or a known app subdomain URL before redirecting — reject external URLs to prevent open-redirect. (b) On Auth0 error, preserve the redirect param so the user can retry without losing their destination. (c) Handle expired/invalid sessions: if session is null after callback, redirect to /login with a 'session_expired' error code.

Step 3 — Improve require-access.ts edge cases: When the session exists but is expired (no user.sub), redirect to /login?redirect={slug}&error=session_expired instead of just /login. This gives the login form context to show a friendly 'session expired' message.

Step 4 — Update login-form.tsx: Add a 'session_expired' error message mapping ('Your session expired — please sign in again.') alongside the existing 'forbidden' mapping. Also ensure the 'New here?' signup link preserves the redirect param from the current URL so signup→login switching doesn't lose the destination app.

Step 5 — Update signup-form.tsx: Auth0 signup flow already defaults returnTo to /my-apps via buildAuthLoginHref. No code change needed for post-email-confirmation redirect (Auth0 handles this via the callback). Verify the redirect param is forwarded from signup page to buildAuthLoginHref (already done in signup/page.tsx).

Step 6 — Enhance unauthorized/page.tsx: (a) Make the app name more prominent in the heading — show 'Access required — {app.name}' instead of generic 'Access required'. (b) Add a 'Request access' CTA that is always visible for signed-in users when self-enroll is allowed, using the existing requestAppAccess server action. (c) When self-enroll is off AND no accessRequest config exists, show a message with the app name and suggest contacting an admin. The current implementation is close but the heading doesn't include the app name.

Step 7 — Validate self-enroll returnTo in self-enroll.ts: appSlugFromReturnTo regex currently only matches /apps/{slug}. Update to also handle full subdomain URLs (https://{subdomain}.apps.lastrev.com/) by extracting subdomain and looking up the app config. This ensures maybeSelfEnrollAfterLogin works for production subdomain returnTo values, not just path-based ones.

Step 8 — Verify app-registry.ts: All 15 auth-gated apps already have auth: true (command-center, generations, accounts, sentiment, meeting-summaries, uptime, standup, sprint-planning, sales, daily-updates, summaries, lighthouse, slang-translator, ai-calculator, area-52). No registry changes needed — the 14 mentioned in the issue plus area-52 (added in PR #93) are already correct.

Step 9 — Document APP_SELF_ENROLL_SLUGS: Add to .env.compose with a comment explaining the format (comma-separated app slugs), behavior (auto-grants view permission on first login), and the development fallback (all slugs allowed when unset in NODE_ENV=development).


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Here's the project context file:

---

## Architecture
- **Entry point**: Next.js 16 App Router in `apps/web/`. Request interception via `apps/web/proxy.ts`. No `middleware.ts` — uses Next.js 16 proxy pattern instead.
- **Micro-apps**: 29+ apps live under `apps/web/app/apps/<slug>/`, each with its own `layout.tsx`. Auth hub is at `app/(auth)/`. No top-level API routes directory — apps handle their own API routes internally.
- **Database**: Supabase (Postgres). Client wrappers in `packages/db/src/` with separate exports: `server.ts`, `middleware.ts`, `service-role.ts`. Queries centralized in `packages/db/src/queries.ts`.
- **Auth**: Auth0 via `packages/auth/` — multi-tenant client factory (per-Host header). Permission checks in server layouts using `requireAppLayoutAccess()`.
- **Packages**: `packages/{auth,billing,db,ui,theme,config,test-utils}` — imported as `@repo/*` workspace aliases. UI has 80+ Radix+Tailwind components.

## Conventions
- TypeScript strict ESM. Server Components by default; `'use client'` only when needed. Tailwind 4 with oklch theme tokens from `packages/theme/`.
- Tests via Vitest (`pnpm test` / `turbo run test`). Test utils in `packages/test-utils/`.
- **Adding a new app**: Register in `apps/web/lib/app-registry.ts` (slug, subdomain, auth, tier, permissions), then create `apps/web/app/apps/<slug>/layout.tsx` with `requireAppLayoutAccess()` for gated apps. Use `publicRoutes` array for hybrid public/gated apps.
- Import from package sub-paths (`@repo/auth/server`, `@repo/db/middleware`) — never from `src/` directly.

## Critical Rules
- **`app-registry.ts` is source of truth** — app routing, access control, and subdomain mapping all derive from it. An unregistered app doesn't exist.
- **Supabase client separation is load-bearing** — `server.ts` for RSC/actions, `middleware.ts` for proxy, `service-role.ts` for admin only. Mixing breaks sessions.
- **Auth0 client must be per-request** (factory pattern via Host header) — never a global singleton.
- **`packages/theme/src/theme.css`** owns all design tokens via `@theme` directive — not tailwind.config files.
- **Never import server-only code into client bundles** — sub-path exports enforce this boundary.

## Active State
- **Test status**: _(pending — run `pnpm test`)_
- **Recent changes**: Billing metadata added to app registry (#11, #5 merged). Main branch has untracked `CLAUDE.md`, `docs/VISION.md`, `.alpha-loop/` files.



## Previous Issue in This Session
- Issue #7: Auth gate: Lighthouse
- Status: success
- Tests: PASSING
- Files changed: 5
- Duration: 312s
- PR: https://github.com/last-rev-llc/lr-apps/pull/94

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #7 (success)
- Auth gate pattern applied cleanly: layout calls `requireAppLayoutAccess("lighthouse")`, registry updated to `auth: true`, matching the established pattern from Area 52 (#6)
- All 4 acceptance criteria tests passed on first run with zero retries across the full monorepo (62 web tests, 114 total)
- Verification correctly skipped — server-side redirect logic is fully covered by unit tests with no UI to validate
- Nothing — all tests passed on first attempt
- Minor: branch carried unrelated Area 52 diff from issue #6 (already merged via PR #93), adding noise to the changeset

### Run #6 (success)
- Clean, minimal implementation: only 3 files changed (layout, registry, test) with no unnecessary modifications
- Test strategy correctly mocks `requireAppLayoutAccess` and covers all 4 acceptance criteria (auth call, unauthenticated redirect, unauthorized redirect, authenticated access)
- Followed existing codebase patterns — matches how other auth-gated apps are structured
- Nothing — all tests passed on first run with zero retries

### Run #5 (success)
- Clean replacement of `publicEntry` boolean with `publicRoutes` string array pattern — more flexible and explicit
- Code review caught stale `publicEntry` references in my-apps page and architecture display before merge
- Comprehensive test coverage: 6 new `requireAppLayoutAccess` tests and 5 new `isPublicRoute` tests, all passing first try
- Nothing — zero test fix retries, all 52 web tests and 8 auth tests passed on first run

### Run #4 (success)
- Clean implementation of all three typed query helpers (`getAppPermission`, `getUserSubscription`, `upsertPermission`) with correct Supabase chaining patterns
- Thorough mock-based unit tests (11/11) covering happy path, null/missing data, error throwing, and correct table/filter assertions
- Proper package scaffolding: vitest config, test script, re-exports from index, and type additions all done in one pass with zero test retries
- Nothing — all tests passed on first run across all packages

### Run #3 (success)
- Clean first-pass implementation: all 15 test-utils tests and 64 total workspace tests passed without retries
- Proper monorepo test infrastructure: Vitest workspace config, Turbo `test` pipeline, and `--passWithNoTests` for packages without tests
- Well-structured mock helpers with chainable APIs (Supabase) and deep-merge overrides (Auth0)
- Nothing — all acceptance criteria met on first attempt
- Minor scope creep: `.env.compose` file was added but is unrelated to issue #3 (unfixed, flagged in review)


## Known Anti-Patterns to Avoid
- Avoid carrying forward diffs from prior issues on the same session branch — creates confusing review diffs even when functionally correct
- Don't skip creating a fresh branch per issue when working sequentially on related tasks
- None observed in this run
- Writing a test that claims to exercise a code branch (glob `/**` matching) but actually re-tests an already-covered exact match — tests should prove distinct behavior
- Skipping browser verification is acceptable for pure server-side auth changes, but should be explicitly justified in the plan rather than silently omitted
- None observed in this run
- Avoid committing unrelated files (`.env.compose`) in feature branches — keep PRs scoped to the issue
- Don't skip `renderWithProviders` tests even when the implementation seems straightforward — the diff shows the file was created but test coverage for it isn't visible in the test output
- Silently ignoring DB write errors (customers.ts upsert doesn't check error result) — can mask data loss in production
- Duplicating types across packages (`Subscription` in billing/types.ts vs `SubscriptionRow` in db/types.ts) creates drift risk — prefer re-exporting from a single source
- Building upsert payloads without including the primary/conflict key field — the original upsertSubscription omitted user_id, which would have caused NOT NULL violations on webhook-driven inserts
- Avoid committing unrelated files (`.env.compose`) in feature branches — pollutes the diff and complicates review

## Scope Rules (CRITICAL)
- ONLY modify files directly related to this issue
- If tests fail due to environment issues (missing venv, wrong port, missing deps), report it — do NOT rewrite test infrastructure
- Do NOT fix unrelated code, even if you notice problems
- Do NOT modify dev server config, build config, fonts, or styling unless the issue specifically requires it
- If the issue lists "Affected Files/Areas", stay within that scope

## Before You Start
1. Read the product vision and technical context above
2. Make decisions that align with the target users and current priority
3. Understand how your changes connect to existing code
4. If you're creating new files, make sure they're wired into the appropriate entry points

## After Implementing
1. Write tests for your changes
2. Run the test command to verify
3. Commit with: git commit -m "feat: Update login/signup flows for universal auth (closes #8)"