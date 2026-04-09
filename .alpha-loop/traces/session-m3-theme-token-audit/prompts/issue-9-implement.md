Implement GitHub issue #9: Audit and document token usage violations

## Summary
Scan all 27 apps for hardcoded colors (hex, rgb, oklch), shadows, border-radius, and font-family values. Produce a per-app violation report that drives the rest of M3.

## Acceptance Criteria
- [ ] Script or tool scans all TSX/CSS files under `apps/web/app/apps/`
- [ ] Detects hardcoded hex values (e.g., `#f59e0b`, `#0a0e1a`)
- [ ] Detects hardcoded rgb/rgba/oklch values
- [ ] Detects hardcoded shadow values not using theme tokens
- [ ] Detects hardcoded border-radius not using theme tokens
- [ ] Detects hardcoded font-family declarations
- [ ] Per-app violation report generated (markdown or JSON)
- [ ] Report categorizes violations by type and severity
- [ ] Report committed to `docs/` for reference


## Implementation Plan
1. Create `scripts/audit-tokens.ts` — a Node/ts-node script that:
   a. Glob-scans all TSX files under `apps/web/app/apps/` (146+ files across 27 apps including command-center sub-apps)
   b. Detects violations via regex patterns:
      - Hex colors: `#[0-9a-fA-F]{3,8}` in className strings and style objects (exclude CSS var definitions in theme files)
      - RGB/RGBA/OKLCH: `rgba?\(`, `oklch\(` in inline styles and template literals
      - Tailwind hardcoded colors: classes like `text-red-500`, `bg-blue-400/20`, `border-amber-500`, `from-cyan-500`, `to-purple-600` etc. (any Tailwind color-number pattern not using semantic tokens like `primary`, `accent`, `destructive`, `muted`)
      - Hardcoded shadows: `boxShadow:` or `shadow-[` with raw values instead of `var(--shadow-*)`
      - Hardcoded border-radius: `borderRadius:` or `rounded-[` with raw pixel/rem values instead of `var(--radius-*)`
      - Hardcoded font-family: `fontFamily:` or `font-[` with raw font names instead of `var(--font-*)`
   c. Categorize each violation with: file path, line number, violation type (color|shadow|radius|font), raw value, severity (high=inline hex/rgb, medium=Tailwind hardcoded color class, low=potentially intentional)
   d. Group results by app name (derive from path: `apps/web/app/apps/{appName}/`)
   e. Output structured JSON to stdout and generate markdown report

2. Generate `docs/token-violations-report.md`:
   - Summary table: app name | total violations | by type breakdown
   - Per-app section with violation details sorted by severity
   - Include the existing token alternatives from `packages/theme/src/theme.css` (e.g., `--color-accent`, `--color-surface`, `--shadow-glass`, `--radius-glass`, `--font-heading`)

3. Add a package.json script entry: `"audit:tokens": "npx tsx scripts/audit-tokens.ts"`

4. Run the script, review output, commit report to `docs/`


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



## Learnings from Previous Runs

### Run #8 (success)
- All 148 tests passed across 8 packages with zero retries, including 7 new test files covering auth redirect logic and layout access control
- Code review caught two critical security/correctness bugs (open redirect via protocol-relative URLs, subdomain-to-slug mapping mismatch) that were fixed before merge
- Self-enroll env var (`APP_SELF_ENROLL_SLUGS`) documented in `.env.compose` with sensible dev fallback (all slugs allowed locally)
- Nothing — all tests passed on first run and review findings were addressed inline

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


## Known Anti-Patterns to Avoid
- **Duplicated subdomain-to-slug mapping**: `SUBDOMAIN_TO_SLUG` in `self-enroll.ts` duplicates data already in `app-registry.ts`, creating a sync risk. The review flagged this but it was left unfixed — should extract to a shared utility
- **Open redirect via protocol-relative URLs**: `isSafeReturnTo` only checked for leading `/` without rejecting `//`, which `new URL` resolves as a protocol-relative redirect to an external domain. Always reject `//` in return-to validation
- Avoid carrying forward diffs from prior issues on the same session branch — creates confusing review diffs even when functionally correct
- Don't skip creating a fresh branch per issue when working sequentially on related tasks
- None observed in this run
- Writing a test that claims to exercise a code branch (glob `/**` matching) but actually re-tests an already-covered exact match — tests should prove distinct behavior
- Skipping browser verification is acceptable for pure server-side auth changes, but should be explicitly justified in the plan rather than silently omitted
- None observed in this run
- Avoid committing unrelated files (`.env.compose`) in feature branches — keep PRs scoped to the issue
- Don't skip `renderWithProviders` tests even when the implementation seems straightforward — the diff shows the file was created but test coverage for it isn't visible in the test output
- The diff includes auth gate changes for multiple other apps (age-of-apes, alpha-wins, area-52, brommie-quake, etc.) beyond the Superstars scope. This suggests the branch accumulated work from prior issues. Future runs should use isolated branches per issue to keep diffs clean and reviewable.
- **Scope expansion without issue tracking**: the run touched 6+ apps beyond soccer-training (age-of-apes, alpha-wins, area-52, etc.) and modified shared auth pages — these changes should ideally map to their own issues for traceability
- **Test files use `globalThis.React = React` hack**: this works but is brittle; a shared test setup in `@repo/test-utils` would be cleaner
- The diff includes auth gate changes for other apps (age-of-apes, alpha-wins, area-52, brommie-quake) that weren't part of issue #20 — batch commits across issues risk muddying git blame and PR scope
- Silently ignoring DB write errors (customers.ts upsert doesn't check error result) — can mask data loss in production
- Duplicating types across packages (`Subscription` in billing/types.ts vs `SubscriptionRow` in db/types.ts) creates drift risk — prefer re-exporting from a single source
- Building upsert payloads without including the primary/conflict key field — the original upsertSubscription omitted user_id, which would have caused NOT NULL violations on webhook-driven inserts

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
3. Commit with: git commit -m "feat: Audit and document token usage violations (closes #9)"