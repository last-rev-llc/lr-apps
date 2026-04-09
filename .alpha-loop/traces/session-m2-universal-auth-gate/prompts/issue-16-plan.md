Analyze this GitHub issue and produce a structured implementation plan.

Issue #16: Auth gate: Dad Joke of the Day

## Summary
Add authentication gate to the Dad Joke of the Day app so it requires login.

## Details
- Update `apps/web/app/apps/dad-joke-of-the-day/layout.tsx` to call `requireAppLayoutAccess("dad-joke-of-the-day")`
- Update app registry entry: set `auth: true`
- Add smoke tests for auth behavior

## Acceptance Criteria
- [ ] `layout.tsx` calls `requireAppLayoutAccess("dad-joke-of-the-day")`
- [ ] App registry entry has `auth: true`
- [ ] Test: unauthenticated request redirects to `/login`
- [ ] Test: authenticated user without permission redirects to `/unauthorized`
- [ ] `pnpm test` passes

Write a JSON file to: plan-issue-16.json

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