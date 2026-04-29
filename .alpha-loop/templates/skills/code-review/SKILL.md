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
- [ ] Mock data shape matches the real type. If mocking a DB row (`SubscriptionRow`, etc.), the mock's field names must match what the type actually declares — `plan: "pro"` where the type says `tier: Tier` will pass Vitest but fail `tsc --noEmit` (issue #168).

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

### 8. Cross-runtime API audit (CRITICAL)
For any change that touches `@repo/logger`, `@repo/auth`, `proxy.ts`, middleware, route handlers with `export const runtime = "edge"`, or shared packages imported by such code:
- [ ] `grep -E 'process\.(stdout|stderr|cwd|chdir)|require\(|^import .* from .fs.' <changed-files>` returns no hits. Edge Runtime polyfills only `process.env`; `process.stdout.write` / `process.stderr.write` are undefined and crash at first call.
- [ ] If the file uses `@opentelemetry/sdk-node` or imports an OTel span helper, confirm it is NOT loaded from an edge-runtime path — the SDK cannot load on edge and produces silent no-ops, defeating any "parent-child spans" acceptance criterion.
- [ ] This bug pattern shipped in **5 consecutive PRs (#147–#151)** and crashed `/api/vitals` and `proxy.ts` at runtime despite Node-environment Vitest tests passing. It must be caught here.

### 9. DOM data-attribute reads must have writers
When a client component reads `document.*.dataset.<key>` or `el.getAttribute(...)`:
- [ ] `grep -rE 'data-<key>=|setAttribute\(.<key>.|dataset\.<key>\s*=' apps/ packages/` finds a writer.
- [ ] If no writer exists, flag as a bug — the read silently returns `undefined` and the feature is broken without any test failure. The `WebVitalsReporter` `dataset.appSlug` bug shipped in **5 consecutive PRs (#147–#151)** because no code anywhere set the attribute.

### 10. Cache writes must have readers
For any new `cacheSet(...)` / Upstash `redis.set` / in-memory cache write:
- [ ] Grep for a corresponding reader on a hot path (`cacheGet`, `getCached`, `<name>Cached`, etc.). A write-only cache burns ops on every request and provides zero benefit.
- [ ] The `app-registry` cache shipped this pattern in #163–#168: `cacheSet` fired on every `getAppBySubdomain`/`getAppBySlug` hit while no caller used the async `*Cached` variants. Flag as wasted Upstash ops, require either wiring the readers or deleting the writes.

### 11. Env var propagation
When the diff adds an env var to `.env.example`, `.env.staging.example`, docs (e.g., `docs/ops/observability.md`), or any reference to a new env var:
- [ ] `grep -E '"<VAR_NAME>"' turbo.json` returns a hit in the `globalEnv` array. Without the entry, Turbo will not propagate the var to tasks and will not invalidate caches when it changes.
- [ ] `OTEL_EXPORTER_OTLP_HEADERS` shipped documented but missing from `globalEnv` in #163–#168. Same pattern recurred for Upstash and Resend env vars in adjacent runs.

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
