Analyze this GitHub issue and produce a structured implementation plan.

Issue #8: Update login/signup flows for universal auth

## Summary
Update the auth hub login/signup flows to support universal auth gate. Ensure redirect-after-login works for all 27 apps, update unauthorized page, and add self-enroll support.

## Acceptance Criteria
- [ ] Redirect-after-login preserves original app subdomain for all 27 apps
- [ ] Unauthorized page shows the app name and a "request access" CTA
- [ ] Self-enroll support: apps in `APP_SELF_ENROLL_SLUGS` auto-grant `view` on first login
- [ ] `APP_SELF_ENROLL_SLUGS` env var documented and configurable
- [ ] Login flow handles edge cases: expired sessions, invalid redirects, unknown apps
- [ ] Signup flow redirects to my-apps after email confirmation
- [ ] All 14 already-gated apps have registry entry updated to `auth: true`

Write a JSON file to: plan-issue-8.json

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