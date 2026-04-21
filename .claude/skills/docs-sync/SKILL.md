---
name: docs-sync
description: Ensure documentation stays in sync with code changes. Trigger when modifying CLI commands, config options, directory structure, or public APIs.
when-to-use: When adding, removing, or changing CLI commands, config fields, directory layout, or user-facing behavior, or writing/updating any docs that make claims about runtime, CI, or tooling behavior
---

# Documentation Sync

When making changes that affect user-facing behavior, always update the corresponding documentation. Equally important: when writing docs, verify that every claim the doc makes about runtime, CI, or tooling behavior actually matches the code.

## What to check

### CLI commands changed?
- Update `README.md` commands table
- Update `CLAUDE.md` commands section
- Update `--help` descriptions in `src/cli.ts`

### Config options changed?
- Update `README.md` Configuration Reference table
- Update `README.md` config example block
- Update `CLAUDE.md` if it references config
- Update the config template in `src/commands/init.ts`

### Directory structure changed?
- Update `CLAUDE.md` Directory Structure section
- Update `README.md` Project Artifacts table

### New skill or agent added?
- Skill: create `templates/skills/<name>/SKILL.md` with frontmatter
- Agent: create `templates/agents/<name>.md` with frontmatter
- Run `alpha-loop sync` to distribute

### Public API or behavior changed?
- Update relevant README sections
- Update CLAUDE.md if architectural

## Drift checks (verify before commit)

These are the doc/reality drift patterns that have shipped repeatedly across recent runs. Run these greps before committing any doc change.

### Runtime-behavior claims must have an invocation site
If the doc says something runs "at startup", "on every request", "during build", etc., the code that supposedly runs must be **imported and invoked** at that boundary, not merely exported. Examples that shipped broken:
- `docs/ops/environments.md` claimed env validation "runs at process startup", but `env()`/`parseEnv()` from `apps/web/lib/env.ts` were exported and tested but never imported anywhere that runs at startup. Issues #206, #207, #208, #209, #210.

For each claim of the form "X runs at Y", grep the codebase for an import or call of X at boundary Y. If you can't find one, either (a) wire the code in, or (b) soften the claim to describe the function as a library/helper.

### `pnpm <script>` references must exist in `package.json`
If a doc references `pnpm db:exec`, `pnpm lint:registry`, or any other `pnpm <script>` invocation, grep the root `package.json` `scripts` block to confirm the script exists. Issue #211 cited a non-existent `pnpm db:exec` that the reviewer caught and replaced.

```
grep -E '"<script-name>"\s*:' package.json
```

### GitHub Actions workflow triggers in docs must match the YAML
If a doc says a workflow runs on `pull_request`, `push`, `deployment_status`, etc., open the actual `.github/workflows/<file>.yml` and confirm the `on:` block matches. `docs/ops/preview-deployments.md` has shipped saying `pull_request` while the workflow used `deployment_status` — flagged in #207, #208, #209, #210 and still drifted.

```
grep -E '^on:|^  pull_request:|^  deployment_status:' .github/workflows/<workflow>.yml
```

## Rules

- Documentation updates MUST be in the same commit as the code change
- Never leave README or CLAUDE.md referencing commands, options, or paths that no longer exist
- When removing a feature, search docs for all references before committing
- Keep README under 300 lines, CLAUDE.md under 200 lines
- A doc claim about runtime/CI/tooling behavior is a contract — verify the code honors it before commit
