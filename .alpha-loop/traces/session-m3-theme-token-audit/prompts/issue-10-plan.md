Analyze this GitHub issue and produce a structured implementation plan.

Issue #10: Standardize glass/shadow/animation usage

## Summary
Replace inline glass effects, shadows, and animations with shared theme utilities across all apps.

## Acceptance Criteria
- [ ] All inline glass effects replaced with `glass`, `glass-sm`, `glass-strong` utilities
- [ ] All inline shadows replaced with theme shadow tokens (`shadow-glass`, `shadow-glass-sm`, `shadow-glow`)
- [ ] All inline animations replaced with `animate-fade-in-up`, `animate-scale-in` utilities
- [ ] No duplicate glass/shadow/animation definitions remain in app-level CSS
- [ ] Build passes with no TypeScript errors

Write a JSON file to: plan-issue-10.json

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