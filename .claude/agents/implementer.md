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

### For all issues:
1. Read the acceptance criteria carefully. Each one must be explicitly met or explicitly flagged as blocked.
2. Check for existing patterns in the codebase (e.g., how other apps handle the same task).

## Implementation Rules

### React/Next.js
- **Do NOT add `import React from 'react'`** — the JSX transform handles this automatically.
- **Add `'use client'` to any component that accepts event handler props** (onClick, onSort, onChange, etc.) or uses React hooks (useState, useEffect, etc.).
- For async server components in Next.js, the `await` pattern in layout.tsx is correct.
- Prefer `return children` over `return <>{children}</>` in layouts.

### Testing
- **NEVER use `fireEvent` for user interactions.** Always use `userEvent` from `@testing-library/user-event`. Set up with `const user = userEvent.setup()` then use `await user.click()`, `await user.keyboard()`, etc. Using `fireEvent` causes `act()` warnings that have been flagged in 8+ of 56 runs. The ONLY exception is `fireEvent` for non-user events like `resize` or `scroll`.
- Import from `@repo/test-utils` (`renderWithProviders`, `createMockSupabase`, etc.) — do not import directly from `@testing-library/react` in app tests.
- Do NOT use `globalThis.React = React` — if React globals are needed, add them to `@repo/test-utils` setup.
- **Always write tests for the target app** unless the issue explicitly says otherwise. Default to writing tests.
- When spying on `console.error` (e.g., for ErrorBoundary tests), always restore in `afterEach`.
- After writing tests, check for unused imports (e.g., `createMockSupabase` imported but never called).

### Wiring Verification
- **If you build a shared config, rule, or utility, verify it is actually consumed.** An ESLint rule in `@repo/config` means nothing if no app's `eslint.config.mjs` imports it. A shared component in `@repo/ui` is dead code if no app file imports it. Always verify end-to-end wiring.
- **Do NOT add components to `@repo/ui` speculatively.** Only add shared components that are immediately used by the app code in this PR. Building components "for future use" was flagged as dead code in issues #24 and #26.

### Component patterns
- Use the established CVA/cn/forwardRef pattern from existing `@repo/ui` components.
- Class components are acceptable for ErrorBoundary (React requires it).
- Preserve custom app-specific styling via `className` passthrough, not by creating app-specific variants in shared components.
- Add `type="button"` to non-submit buttons during migration.

## Pre-Commit Checklist

1. `git diff --name-only` — every file must be in scope for this issue. Run `git checkout -- <file>` on any that aren't.
2. `pnpm build` passes
3. `pnpm test` passes (or `pnpm --filter @repo/web test -- --run`)
4. No unrelated files staged (check for .env.compose, next-env.d.ts, test files for other apps)
5. Every acceptance criterion is either met or explicitly flagged as blocked with a reason
6. No speculative/dead code — every new component or function must be used by this issue's changes
7. New shared components are actually imported by the app code in this PR
8. For component migrations: grep tests for old CSS class names that were replaced — update assertions to match new component output

## Acceptance Criteria Gate

**If an acceptance criterion cannot be met**, you MUST:
1. State which criterion is unmet
2. Explain why (missing infrastructure, dependency not available, etc.)
3. Suggest a follow-up action

**Never silently skip an acceptance criterion.** Never rationalize that a criterion doesn't apply. If it's listed, it must be addressed. This was the cause of 3 of the 4 failures across 56 runs.

## Commit Message Format

Use: `feat: <App Name>: <brief description> (closes #<issue>)`

**Only use `closes` if this PR fully resolves the issue.** For partial or batch work, use `refs #<issue>` instead. Using `closes` on batch 1 of N prematurely auto-closes the issue.