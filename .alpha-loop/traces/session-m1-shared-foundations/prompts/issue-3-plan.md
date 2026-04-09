Analyze this GitHub issue and produce a structured implementation plan.

Issue #3: Add Vitest workspace config + shared test utilities

## Summary
Configure Vitest at monorepo root with workspace support and create `packages/test-utils` with mock helpers for Supabase, Auth0, and React rendering.

## Details
- Configure Vitest at monorepo root with workspace support
- Create `packages/test-utils` with helpers:
  - Mock Supabase client
  - Mock Auth0 session
  - `renderWithProviders()` wrapper
- Add `test` script to every package

## Acceptance Criteria
- [ ] `packages/test-utils/` exists with `package.json` and barrel exports
- [ ] `src/mock-supabase.ts` — chainable mock Supabase client with `createMockSupabase()`
- [ ] `src/mock-auth0.ts` — mock Auth0 session helper with `createMockAuth0()`
- [ ] `src/render-with-providers.tsx` — `renderWithProviders()` wrapper using `@testing-library/react`
- [ ] Every package in the workspace has a `test` script in `package.json`
- [ ] `pnpm test` from root runs all workspace tests via Turbo
- [ ] `@repo/test-utils` added as devDependency to packages that need it

Write a JSON file to: plan-issue-3.json

The file must contain ONLY valid JSON with this exact schema:

{
  "summary": "One-line description of what needs to be done",
  "files": ["src/path/to/file.ts", "..."],
  "implementation": "Concise step-by-step plan. What to create, modify, wire up. No issue restatement.",
  "testing": {
    "needed": true,
    "reason": "Why tests are or aren't needed for this change"
  },
  "verification": {
    "needed": false,
    "instructions": "If needed: specific playwright-cli steps to verify the feature. If not needed: omit this field.",
    "reason": "Why verification is or isn't needed (e.g. no UI changes, API-only, config change)"
  }
}

Rules:
- testing.needed: true if ANY code changes could affect behavior. false only for docs, config, or comments.
- verification.needed: true ONLY if the issue changes user-visible UI that can be tested in a browser.
- verification.instructions: if needed, list the exact playwright-cli commands to verify (open URL, click elements, check content).
- implementation: be concise and actionable. List files to modify and what to change in each.
- Write ONLY the JSON file. Do not create any other files or make any code changes.