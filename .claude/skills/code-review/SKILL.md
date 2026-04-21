---
name: code-review
description: Code review standards for automated and manual reviews. Use when reviewing code changes.
auto_load: true
priority: high
---

# Code Review Skill

## Trigger
When reviewing code changes (PR review, post-implementation review).

## Review Checklist

### 1. Requirements Compliance
- [ ] All acceptance criteria met
- [ ] No scope creep (unnecessary changes)
- [ ] Edge cases handled
- [ ] **Primary deliverables present**: for each named artifact in the AC (file path, migration name, SQL identifier, function name), grep/ls confirms it exists in the diff. Issue #214 shipped a CI workflow + layout refactor while containing zero of the DB-index deliverables the issue actually named — never accept rationalizations like "adjacent work covers the intent."

### 2. Code Quality
- [ ] Follows project conventions (check CLAUDE.md)
- [ ] No `any` types in TypeScript
- [ ] Functions are small and focused
- [ ] No dead code or commented-out code
- [ ] No `console.log` left in production code
- [ ] No non-null assertions (`!`) on helper returns whose declared type is `T | null` — narrow with `if (!x) return ...` instead. The `access!.user.id` pattern recurred in #212, #213, #215, #216.

### 3. Security (OWASP Top 10)
- [ ] No SQL injection (use parameterized queries)
- [ ] No XSS (sanitize user input)
- [ ] No command injection (validate shell args)
- [ ] Auth/authz checks in place
- [ ] No secrets in code

### 4. Testing
- [ ] New code has tests
- [ ] Tests cover happy path AND error cases
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test names describe behavior, not implementation
- [ ] Test names that promise integration (`end-to-end`, `integration`, `real DB`) actually exercise that boundary — not mocked. See `testing-patterns` skill for the rule.
- [ ] User interactions use `userEvent`, not `fireEvent`. `act()` warnings in stderr are no longer acceptable as "non-blocking" — they indicate `fireEvent` was used where `userEvent` should be.

### 5. Performance
- [ ] No N+1 queries
- [ ] No unnecessary re-renders
- [ ] Large lists paginated

### 6. CI guard integrity
Whenever a PR adds a new lint/test/consistency script and wires it into a CI job:
- [ ] The job that invokes the script provisions everything the script needs (env vars, Docker services, Supabase, DB). A Supabase-dependent check wired into a `lint` or `ci` job that does not run `supabase start` will silently exit 0 and provide zero protection.
- [ ] Grep the script for `process.exit(0)`, `|| exit 0`, and `if (!process.env.X) { console.log('skip'); return; }` — silent skips in service-less jobs are false-positive guards. Either move the script to a job with the prerequisite, or replace the skip with a loud failure.
- [ ] Pattern `lint:registry` wired into `ci` job without Supabase running shipped in **5 consecutive PRs (#212–#216)**. This is the single most-recurring CI antipattern in this codebase — actively look for it.

### 7. Runtime-claim wiring
When the diff exports a validator, initializer, or any function that documentation claims runs "at startup" / "on every request" / "during build":
- [ ] Verify the function is **imported and invoked** at the boundary the docs claim. An exported-but-never-called validator means the documented guarantee doesn't hold. Issues #206–#210 all shipped `env()`/`parseEnv()` exported and tested but never invoked at startup, with docs claiming startup validation.

## Action on Findings

- **CRITICAL**: Fix immediately before merge
- **WARNING**: Fix now if possible, create issue if not
- **SUGGESTION**: Note for future improvement

## Output Format

```markdown
### Review Summary
**Status**: PASS | FAIL
**Issues fixed**: N
**Issues deferred**: N (with issue links)
```
