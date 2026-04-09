Post-session holistic code review for session: session/m4-app-batch-1-most-complete

Run `git diff origin/main...HEAD` to see ALL changes made in this session.
Then read the actual files that were modified.

## Issues Processed in This Session

- #23: Extend @repo/ui with missing common components — success
- #24: Command Center: component migration — success
- #25: Command Center: app-specific tests — success
- #26: Accounts: component migration — success
- #27: Accounts: app-specific tests — success
- #28: Standup: component migration — success
- #29: Standup: app-specific tests — success
- #30: Summaries: component migration — success
- #31: Summaries: app-specific tests — success
- #32: Meeting Summaries: component migration — success
- #33: Meeting Summaries: app-specific tests — success
- #34: Uptime: component migration — success
- #35: Uptime: app-specific tests — success
- #36: Sentiment: component migration — failure (tests failing)
- #37: Sentiment: app-specific tests — success
- #38: Sprint Planning: component migration — failure (tests failing)
- #39: Sprint Planning: app-specific tests — failure (tests failing)

## Review Focus

Each issue already received its own per-issue code review.
Your job is to catch problems that per-issue reviews MISS — things that only become visible when looking at ALL changes together:

### 1. Cross-Issue Integration (MOST IMPORTANT)
- Do changes from different issues conflict or create inconsistencies?
- Are there duplicate implementations of the same concept from different issues?
- Do shared types, interfaces, or utilities remain consistent across all changes?
- Are there orphaned imports or dead code created when different issues refactored the same area?

### 2. Dependency Wiring Across Issues
- If Issue A creates a service/repo and Issue B consumes data from it: is the service actually injected in the bootstrap/DI layer?
- Are there None-guard patterns (if x is not None) that silently hide missing wiring?
- For new data pipelines: trace from write (tool execution, API call) → persist (DB) → read (query) → display (UI/CLI). Is any step broken?

### 3. Completeness vs Requirements
- For each issue above, do the changes actually fulfill what the issue asked for?
- Are there any partial implementations (e.g., new types defined but never used, API endpoints without callers)?
- Did any issue introduce a feature that another issue accidentally broke?

### 4. Code Quality
- Inconsistent naming or patterns across changes from different issues
- Dead code (functions, imports, variables) that no remaining code references
- Missing error handling at integration boundaries

### 5. Security Scan
- Command injection (unquoted shell interpolation, unsanitized user input in exec)
- Path traversal (unchecked relative paths, missing boundary validation)
- Unsafe file operations (writing to user-controlled paths without validation)
- Hardcoded secrets or credentials

## Product Vision (guide your review decisions)
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.


## Actions

- CRITICAL: Fix the issue directly, run tests, and commit with: `git commit -m "fix: address session review findings"`
- WARNING: Fix if possible, commit the fix
- INFO: Note it but do not block

## Gate Result

After your review, write your findings to a JSON file named `review-session.json` in the current directory.

```json
{
  "passed": true,
  "summary": "One-line summary of session review",
  "findings": [
    {
      "severity": "critical|warning|info",
      "description": "What the issue is",
      "fixed": true,
      "file": "path/to/file.ts"
    }
  ]
}
```

Rules:
- passed=true if all critical/warning issues are fixed.
- passed=false if any critical/warning issues remain unfixed.
- findings: list ALL issues found, with fixed=true for ones you fixed.
- If the code is clean, set passed=true with an empty findings array.