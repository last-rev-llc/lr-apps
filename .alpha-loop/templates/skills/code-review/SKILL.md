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
- [ ] **Primary deliverable artifacts present in the diff.** If the issue names a migration file, index, function, or route, grep/ls to confirm it exists. Issue #214 shipped a CI workflow and layout refactor while containing zero of the DB-index deliverables the issue named — this must be caught here.
- [ ] No scope creep (unnecessary changes)
- [ ] Edge cases handled

### 2. Code Quality
- [ ] Follows project conventions (check CLAUDE.md)
- [ ] No `any` types in TypeScript
- [ ] No non-null assertions (`!`) on helper returns whose type is `T | null`
- [ ] Functions are small and focused
- [ ] No dead code or commented-out code
- [ ] No `console.log` left in production code

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
- [ ] **Test name matches test reality.** Tests named `end-to-end` / `integration` / `real DB` must actually exercise that boundary, not mock it. A mocked test with an integration-flavored name is worse than no test.
- [ ] **RLS/integration tests seed `auth.users` before any FK-dependent insert**, and seed upserts throw on error (`.throwOnError()` or explicit check). Silent FK violations make RLS tests pass for the wrong reason.

### 5. CI Guard Integrity
- [ ] New lint/test/consistency scripts run in a CI job that actually provisions their prerequisites. If `lint:registry` needs Supabase, it must live in the job that runs `supabase start` — not the generic `lint`/`ci` job. This exact pattern (`lint:registry` wired to a service-less job) was the same finding in 5 consecutive runs (#212–#216).
- [ ] Scripts that silent-skip when env vars are missing (`process.exit(0)`, `|| exit 0`, `if (!process.env.X) return`) must either fail loudly or be moved to a job where the env is guaranteed present.

### 6. Performance
- [ ] No N+1 queries
- [ ] No unnecessary re-renders
- [ ] Large lists paginated

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
