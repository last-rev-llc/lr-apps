Analyze this GitHub issue and produce a structured implementation plan.

Issue #23: Extend @repo/ui with missing common components

## Summary
Audit component gaps needed for M4–M6 app migrations and build missing shared components in `@repo/ui`.

## Details
- Audit all 27 apps for commonly-used UI patterns not yet in `@repo/ui`
- Likely needed: `Table`, `DataGrid`, `StatusBadge`, `LoadingSkeleton`, `ErrorBoundary`, `EmptyState` variants
- Follow existing patterns: forwardRef, CVA (class-variance-authority), cn() utility
- Each component should support theme tokens and dark mode
- Add Storybook-style examples or tests for variant coverage

## Acceptance Criteria
- [ ] Audit complete — documented list of needed components
- [ ] `Table` component with sortable columns and row selection
- [ ] `DataGrid` component for tabular data display
- [ ] `StatusBadge` component with semantic color variants
- [ ] `LoadingSkeleton` component with configurable shapes
- [ ] `ErrorBoundary` wrapper component
- [ ] `EmptyState` component with icon, title, description, action slots
- [ ] All components use forwardRef, CVA, cn() patterns
- [ ] All components render with theme tokens
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes

Write a JSON file to: plan-issue-23.json

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