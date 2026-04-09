Analyze this GitHub issue and produce a structured implementation plan.

Issue #4: Expand  with typed query helpers

## Summary
Add typed query helpers to `@repo/db` to replace raw `.from().select().eq()` chains across the codebase.

## Details
- `getAppPermission(userId, slug)` — replaces raw `.from("app_permissions").select()` chains
- `getUserSubscription(userId)` — for billing package consumption
- `upsertPermission()` — for self-enroll and admin flows
- Typed return types for all helpers

## Acceptance Criteria
- [ ] `packages/db/src/queries.ts` exists with typed query helpers
- [ ] `getAppPermission(userId, slug)` returns `Permission | null`
- [ ] `getUserSubscription(userId)` returns `SubscriptionRow | null`
- [ ] `upsertPermission(userId, appSlug, permission)` returns `AppPermission`
- [ ] `SubscriptionRow` type added to `packages/db/src/types.ts`
- [ ] `Database` interface updated with `subscriptions` table
- [ ] Tests in `packages/db/src/__tests__/queries.test.ts` cover all helpers
- [ ] Queries re-exported from `packages/db/src/index.ts`
- [ ] `vitest.config.ts` and `test` script added to `packages/db/package.json`

Write a JSON file to: plan-issue-4.json

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