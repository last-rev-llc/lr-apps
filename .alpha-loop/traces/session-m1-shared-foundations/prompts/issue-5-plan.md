Analyze this GitHub issue and produce a structured implementation plan.

Issue #5: Update auth middleware for universal gate

## Summary
Update `requireAppLayoutAccess()` to gate ALL apps by default, removing the `publicEntry` bypass. Add `publicRoutes` escape hatch for specific paths.

## Details
- Update `requireAppLayoutAccess()` to gate ALL apps by default (remove `publicEntry` bypass)
- Add `publicRoutes` escape hatch for specific paths (webhooks, marketing pages)
- Ensure redirect-after-login works for all 27 apps

## Acceptance Criteria
- [ ] `requireAppLayoutAccess()` calls `requireAccess()` for ALL apps regardless of `publicEntry` flag
- [ ] `publicEntry` bypass logic removed entirely
- [ ] `publicRoutes` escape hatch exists for webhook endpoints and marketing pages
- [ ] Redirect-after-login preserves the original app subdomain for all 27 apps
- [ ] Tests verify: standard apps gated, formerly-public apps gated, unknown slugs gated
- [ ] All existing tests continue to pass
- [ ] No regressions in proxy.ts routing

Write a JSON file to: plan-issue-5.json

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