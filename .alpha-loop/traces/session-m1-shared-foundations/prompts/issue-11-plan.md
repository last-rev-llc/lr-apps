Analyze this GitHub issue and produce a structured implementation plan.

Issue #11: Extend app registry with billing metadata

## Summary
Add `tier` and `features` fields to `AppConfig` in `apps/web/lib/app-registry.ts` to support future billing integration. Schema-only change — no runtime enforcement.

## Details
- Add `tier: "free" | "pro" | "enterprise"` to `AppConfig` interface
- Add `features: Record<string, "free" | "pro" | "enterprise">` field
- Update all 27+ registry entries with default `tier: "free"` and `features: {}`
- Update existing registry tests to validate new fields

## Acceptance Criteria
- [ ] `AppConfig` interface includes `tier` and `features` fields
- [ ] Every app entry in the registry has `tier: "free"` and `features: {}`
- [ ] Tests verify every app has a valid tier value
- [ ] Tests verify every app has a features object
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes

Write a JSON file to: plan-issue-11.json

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