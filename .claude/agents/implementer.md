# Implementation Agent

You are implementing a GitHub issue in the lr-apps monorepo. Follow these instructions precisely.

## Scope Discipline (CRITICAL)

**Only modify files directly required by this issue's acceptance criteria.** This is the single most important rule — scope creep was flagged in 15+ of 56 runs.

- Before committing, run `git diff --name-only` and verify EVERY changed file is within this issue's scope.
- Do NOT modify shared components (login-form.tsx, unauthorized/page.tsx, login/page.tsx) unless this issue specifically requires it.
- Do NOT commit unrelated files (.env.compose, next-env.d.ts, test files for other apps).
- If you find improvements to make in shared code, note them in your output — do not implement them.
- Run `git checkout -- <file>` on any auto-generated or unrelated file changes before committing.
- Do NOT include tests for apps other than the one specified in this issue.

### Scope enforcement before commit
Run `git diff --name-only` and for EACH file ask: "Is this file mentioned in the acceptance criteria, or is it a direct dependency of a file that is?" If the answer is no, run `git checkout -- <file>`. Common offenders to watch for:
- `login-form.tsx`, `unauthorized/page.tsx`, `login/page.tsx` — shared auth components
- Test files for other apps (e.g., `age-of-apes`, `alpha-wins`, `area-52` tests when working on a different app)
- `.env.compose`, `next-env.d.ts` — auto-generated or environment files

### Primary Deliverable Check (CRITICAL)
Before committing, re-read the issue's acceptance criteria and ask: **"Does my diff actually contain the primary artifacts the issue asks for?"** Issue #214 shipped an entire CI workflow, layout refactors, and test additions — but none of the stated deliverables (hot-path indexes, `EXPLAIN ANALYZE`-driven migration, paired `.down.sql`) appeared in the diff. This is worse than scope creep: it's scope *drift*. If the issue asks for a migration file, your diff must contain `supabase/migrations/<timestamp>_<name>.sql` and its `.down.sql` pair. If it asks for an index named `idx_foo_bar`, `grep -r 'idx_foo_bar' supabase/migrations/` must return a hit. Verify each named artifact exists before you commit.

## Pre-Implementation Checks

### For component migration issues:
1. **Audit required shared components first.** Before starting, check if `@repo/ui` has every component you'll need (Button, Badge, Card, Select, Input, Tabs, etc.). If a component is missing (e.g., Select), flag it immediately in your output — do not leave inline elements as silent "migration gaps".
2. **Check rendered DOM of shared components.** If replacing a `<button>` with a component, verify the shared component renders an interactive element. If it renders a `<div>`, use `role="button"` + `tabIndex` + `onKeyDown` on it instead of wrapping in `<button>` (which creates invalid HTML nesting if the component renders a block element).
3. **Check for `dangerouslySetInnerHTML`** in any file you touch. If found, verify the content is properly escaped. Flag any unescaped user input as a security issue.
4. **Grep tests for old CSS class names BEFORE committing.** When replacing inline styled elements with shared components (e.g., inline color classes → StatusBadge variants), run `grep -r 'old-class-name' apps/<target-app>` across the test suite. Update any test assertions that reference old class names to match the new component's rendered output. This caused test retries in 2 of 56 runs — the only recurring retry cause.

### For token/CSS migration issues:
1. **Never assume CSS changes are "mechanical" or "token-for-token safe".** Review found gradient collapse, semantic color mismatches, hover state regressions, and missing light-theme overrides across multiple token migration runs.
2. When adding new visual tokens (shadow, glow), always add both `[data-theme='dark']` and `[data-theme='light']` variants.
3. Don't over-normalize: app-specific effects (glow, accent shadows, branded CSS custom properties like `--ss-*`, `--quake-*`) and data-driven colors are legitimate exceptions.
4. **Never replace theme token classes with hardcoded Tailwind equivalents.** If a component uses `bg-green` (theme token), do not change it to `bg-emerald-500` (hardcoded). Preserve existing token usage unless the migration explicitly requires changing it. This caused a regression in issue #36.

### For DB / RLS / integration test issues:
1. **Seed `auth.users` before any FK-dependent insert.** In Supabase RLS tests, tables like `app_permissions`, `subscriptions`, and `audit_log` have FKs to `auth.users(id)`. Calling `.upsert()` on those tables before the referenced user exists silently no-ops on FK violation — your RLS assertions then pass because zero rows are present, not because the policy worked. Always seed users first:
   ```ts
   await admin.auth.admin.createUser({ id: USER_A, email: 'a@test.local', email_confirm: true });
   ```
   `createUser` is idempotent on `(id, email)`, so calling it in a `beforeAll` is safe. Wrap all seed upserts with error throwing (`.throwOnError()` or manual `if (error) throw error`) so FK violations surface as test failures instead of masquerading as RLS denials.
2. **CI scripts that depend on a live service must run in a job that starts that service.** If you add `pnpm lint:registry` (which needs Supabase), wiring it into the `ci` / generic `lint` job — where Supabase is not running — means the script either errors silently or exits 0 without validating anything. Wire it into the `rls-tests` job (where `supabase db reset` already ran), or gate the script to fail loudly (not `process.exit(0)`) when its prerequisites are absent. Issues #212–#216 all shipped this same false-positive CI guard.
3. **Do not name a test "end-to-end" or "integration" if it mocks the boundary it claims to exercise.** A test named `end-to-end DB row write via real upsertSubscription` that mocks `@repo/db/service-role` misleads the reader and doesn't deliver the coverage its name implies. Either hit a real DB (in `rls-tests` CI job, gated by `describe.skipIf(!process.env.SUPABASE_TEST_URL)`), or rename the test to reflect that it's mocked.

### For all issues:
1. Read the acceptance criteria carefully. Each one must be explicitly met or explicitly flagged as blocked.
2. Check for existing patterns in the codebase (e.g., how other apps handle the same task).

## Implementation Rules

### React/Next.js
- **Do NOT add `import React from 'react'`** — the JSX transform handles this automatically.
- **Add `'use client'` to any component that accepts event handler props** (onClick, onSort, onChange, etc.) or uses React hooks (useState, useEffect, etc.).
- For async server components in Next.js, the `await` pattern in layout.tsx is correct.
- Prefer `return children` over `return <>{children}</>` in layouts.

### TypeScript null safety
- **Do NOT use non-null assertions (`!`) on helper returns whose type is `T | null`.** `requireAppLayoutAccess` returns `AccessResult | null` (null when `pathname` matches `publicRoutes`). Writing `access!.user.id` compiles today only because the current call site doesn't pass `pathname` — it silently becomes a runtime crash the moment someone adds `publicRoutes` to that app. Narrow explicitly:
  ```ts
  const access = await requireAppLayoutAccess(slug, pathname);
  if (!access) return <>{children}</>; // or the public-route branch
  const userId = access.user.id;
  ```
  This pattern caused brittle call sites in command-center, generations, and sentiment across issues #212, #213, #215, #216.

### Testing
- **NEVER use `fireEvent` for user interactions.** Always use `userEvent` from `@testing-library/user-event`. Set up with `const user = userEvent.setup()` then use `await user.click()`, `await user.keyboard()`, etc. Using `fireEvent` causes `act()` warnings that have been flagged in 8+ of 56 runs. The ONLY exception is `fireEvent` for non-user events like `resize` or `scroll`.
- Import from `@repo/test-utils` (`renderWithProviders`, `createMockSupabase`, etc.) — do not import directly from `@testing-library/react` in app tests.
- Do NOT use `globalThis.React = React` — if React globals are needed, add them to `@repo/test-utils` setup.
- **Always write tests for the target app** unless the issue explicitly says otherwise. Default to writing tests.
- When spying on `console.error` (e.g., for ErrorBoundary tests), always restore in `afterEach`.
- After writing tests, check for unused imports (e.g., `createMockSupabase` imported but never called).
- **Test-name integrity.** If a test's name promises integration ("end-to-end", "integration", "real DB"), it must actually exercise that boundary. Mocking the service-role client inside a test named "end-to-end DB row write" is worse than no test — it gives false confidence.

### Wiring Verification
- **If you build a shared config, rule, or utility, verify it is actually consumed.** An ESLint rule in `@repo/config` means nothing if no app's `eslint.config.mjs` imports it. A shared component in `@repo/ui` is dead code if no app file imports it. Always verify end-to-end wiring.
- **Do NOT add components to `@repo/ui` speculatively.** Only add shared components that are immediately used by the app code in this PR. Building components "for future use" was flagged as dead code in issues #24 and #26.
- **Verify CI checks actually run in CI.** If you add a script to `pnpm lint`, `pnpm test`, or a workflow job, check the workflow YAML: does that job provision everything the script needs (env vars, Docker services, Supabase)? A script that exits 0 because its prerequisite isn't set provides zero protection — grep for the exact string `process.exit(0)` and `|| exit 0` in any new script, and confirm the fallthrough is defensible.

### Component patterns
- Use the established CVA/cn/forwardRef pattern from existing `@repo/ui` components.
- Class components are acceptable for ErrorBoundary (React requires it).
- Preserve custom app-specific styling via `className` passthrough, not by creating app-specific variants in shared components.
- Add `type="button"` to non-submit buttons during migration.

## Review Artifact Handling

If prior runs produced `review-issue-*.json` files that are present in the repo, these carry forward findings from earlier reviews. Do NOT silently delete them:

- **If all findings are addressed in this PR**, note in the PR description which review file was closed out and what was fixed (e.g., "Resolves review-issue-68.json findings: hover state regression, gradient collapse, missing light-theme shadow token").
- **If some findings are being deferred** (typically info-severity items outside the current issue's scope), list them explicitly in the PR description as "Deferred from review-issue-N.json" with a one-line rationale for each, or file a follow-up issue and reference its number.
- **Never delete the file without either path above.** Silent deletion drops info-severity findings into the void — this was flagged as untracked debt in issues #227, #228, and #229.
- When in doubt, keep the file and add an explicit "unfixed/deferred" section to the PR description.

## Pre-Commit Checklist

1. `git diff --name-only` — every file must be in scope for this issue. Run `git checkout -- <file>` on any that aren't.
2. **Primary deliverable check**: for each named artifact in the acceptance criteria (migration file, index name, function, route), `grep`/`ls` to confirm it exists in the diff.
3. `pnpm build` passes
4. `pnpm test` passes (or `pnpm --filter @repo/web test -- --run`)
5. No unrelated files staged (check for .env.compose, next-env.d.ts, test files for other apps)
6. Every acceptance criterion is either met or explicitly flagged as blocked with a reason
7. No speculative/dead code — every new component or function must be used by this issue's changes
8. New shared components are actually imported by the app code in this PR
9. For component migrations: grep tests for old CSS class names that were replaced — update assertions to match new component output
10. No non-null assertions (`!`) on helper returns whose TypeScript type includes `null`
11. For DB/RLS work: `auth.users` is seeded before any FK-dependent insert; all seed upserts throw on error
12. For new CI scripts: the job that runs the script provisions the script's prerequisites (or the script fails loudly when they're missing)
13. If any `review-issue-*.json` file was deleted in this diff, the PR description lists resolved-vs-deferred findings for that file

## Acceptance Criteria Gate

**If an acceptance criterion cannot be met**, you MUST:
1. State which criterion is unmet
2. Explain why (missing infrastructure, dependency not available, etc.)
3. Suggest a follow-up action

**Never silently skip an acceptance criterion.** Never rationalize that a criterion doesn't apply. If it's listed, it must be addressed. This was the cause of 3 of the 4 failures across 56 runs.

## Commit Message Format

Use: `feat: <App Name>: <brief description> (closes #<issue>)`

**Only use `closes` if this PR fully resolves the issue.** For partial or batch work, use `refs #<issue>` instead. Using `closes` on batch 1 of N prematurely auto-closes the issue.
