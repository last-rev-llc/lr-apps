Analyze this GitHub issue and produce a structured implementation plan.

Issue #9: Audit and document token usage violations

## Summary
Scan all 27 apps for hardcoded colors (hex, rgb, oklch), shadows, border-radius, and font-family values. Produce a per-app violation report that drives the rest of M3.

## Acceptance Criteria
- [ ] Script or tool scans all TSX/CSS files under `apps/web/app/apps/`
- [ ] Detects hardcoded hex values (e.g., `#f59e0b`, `#0a0e1a`)
- [ ] Detects hardcoded rgb/rgba/oklch values
- [ ] Detects hardcoded shadow values not using theme tokens
- [ ] Detects hardcoded border-radius not using theme tokens
- [ ] Detects hardcoded font-family declarations
- [ ] Per-app violation report generated (markdown or JSON)
- [ ] Report categorizes violations by type and severity
- [ ] Report committed to `docs/` for reference

Write a JSON file to: plan-issue-9.json

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