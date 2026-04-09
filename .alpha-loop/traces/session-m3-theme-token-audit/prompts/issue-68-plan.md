Analyze this GitHub issue and produce a structured implementation plan.

Issue #68: Replace hardcoded tokens — batch 1 (internal apps)

## Summary
Replace inline color values with Tailwind theme token classes across internal apps: Command Center, Accounts, Standup, Sprint Planning, Summaries, Daily Updates, Sentiment, Meeting Summaries, Uptime, Sales.

## Acceptance Criteria
- [ ] No hardcoded hex/rgb/oklch color values in any listed app
- [ ] All colors reference theme tokens (e.g. `bg-navy-800` not `bg-[#0f1629]`)
- [ ] Visual regression baseline snapshot per app
- [ ] Existing functionality preserved

Write a JSON file to: plan-issue-68.json

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