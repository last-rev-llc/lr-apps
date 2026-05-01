# Session Summary: session/20260501-071623

## Overview
All 5 issues (#1011–#1015) in this session were misrouted to the lr-apps Next.js monorepo but actually target an OpenClaw/AlphaAgent Docker/Express codebase (paths like `docker/entrypoint.sh`, `dashboard/server/`, `dashboard/spa/`). The reviewer correctly detected the mismatch in 75s per issue and broke the retry loop with info-severity findings, but the harness reported `status: success` despite zero acceptance criteria being met — masking an orchestration-level routing bug.

## Recurring Patterns
- **Repo-identity preflight via Glob**: globbing referenced paths (`workspace-init*`, `entrypoint.sh`, `dashboard/**`) against the worktree reliably catches misrouting in seconds, before any speculative code generation.
- **CLAUDE.md as positive evidence**: citing the "single Next.js deployable under apps/web/" invariant turns "files missing" into an auditable architectural mismatch claim.
- **Pass-with-info as escape hatch**: marking the gate passed with info-severity findings (instead of failing critical) cleanly breaks retry loops on unfixable orchestration errors.
- **Structured `fixableInThisRepo: false` + `requiredAction`** in review-batch.json surfaces routing errors back to the operator without producing dead code.
- **Test suite stays green**: all 1081 tests pass (full Turbo cache hit) on every run, confirming no collateral damage from the no-op outcome.

## Recurring Anti-Patterns
- **`status: success` on zero-work runs**: the harness conflates "gate passed" with "issue resolved", corrupting telemetry and hiding the routing bug across all 5 issues.
- **Retrying misrouted batches in-loop**: branch `agent/issue-1011` cycled three commits (fca4c9a → 88ebdad → fbd4860) creating/deleting the gate file before settling — retries within the wrong repo can never succeed.
- **Stray `review-batch.json` artifacts**: orchestration metadata leaking into the working tree across runs creates diff noise and confuses downstream review.
- **Risk of fabricating foreign trees**: agents were tempted to scaffold `docker/`, `dashboard/server/`, `dashboard/spa/` to satisfy criteria, which would violate CLAUDE.md's single-deployable invariant.

## Recommendations
- **Add a batch-dispatcher preflight**: before dispatching, run `Glob` on every file path mentioned in each issue's acceptance criteria against the target worktree. If >50% miss AND tech-stack signals (Express, jq, Dockerfiles) don't match the repo's CLAUDE.md, refuse to dispatch and emit `routing_error` with the suspected correct repo.
- **Introduce a `misrouted` / `blocked-misroute` run status**: distinct from `success`, so dashboards stop double-counting routing failures as wins. Trigger when `passed: true` but git diff shows zero source changes.
- **Re-route #1011–#1015 to OpenClaw/AlphaAgent**: operator action — these issues will never resolve in lr-apps regardless of agent quality.
- **Add gate-file cleanup to session teardown**: ensure `review-batch.json` is removed (not committed) at the end of every run to prevent artifact pollution between sessions.
- **Update `implementation-planning` skill**: add a precondition step — "If the issue references file paths, verify they exist via Glob before planning. If not, halt with `routing_error` rather than scope-drifting into unrelated work."
- **Detect once at batch start, not per-issue**: when 5 sibling issues all reference the same absent tree, flag the batch once instead of burning 5× verification budgets.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 5 |
| Success rate | 100% |
| Avg duration | 75s |
| Total duration | 6 min |
