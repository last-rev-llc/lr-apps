Analyze this GitHub issue and produce a structured implementation plan.

Issue #24: Command Center: component migration

## Summary
Migrate Command Center hub page and shared module chrome to `@repo/ui` components. Sub-module internals are deferred to M6.

## Details
- Replace inline buttons, cards, badges, inputs, navigation with `@repo/ui` equivalents
- Migrate dashboard grid layout and module navigation sidebar
- Preserve all existing functionality
- Leave unique components but ensure they use theme tokens
- This is the largest migration surface in the codebase

## Acceptance Criteria
- [ ] Hub page uses `@repo/ui` Card, Button, Badge components
- [ ] Sidebar navigation uses `@repo/ui` navigation components
- [ ] Module chrome (headers, breadcrumbs, layout) uses shared components
- [ ] No inline Tailwind button/card/badge patterns remain in hub/chrome code
- [ ] All existing functionality preserved
- [ ] `pnpm build` passes
- [ ] Visual appearance matches or improves current design

Write a JSON file to: plan-issue-24.json

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