# lr-apps: Project Vision

**Last Rev Apps** is an internal platform hosting 27 web applications under a unified monorepo, served via subdomain routing at `*.apps.lastrev.com`. The platform serves Last Rev's team with tools ranging from operational dashboards (Command Center, Sprint Planning, Standup) to consumer-facing experiments (Dad Joke of the Day, Cringe Rizzler, Generations).

## Current Reality

The platform works but lacks consistency and guardrails. Only 4 of 27 apps use the shared UI library. Most hardcode colors and styles inline. 13 apps have no authentication. Zero test files exist anywhere. A comprehensive theme token system and component library exist in shared packages but go largely unused.

## Target State

A production-quality platform where every app:

- **Requires authentication** with role-based access and self-enrollment
- **Uses shared design tokens** from `@repo/theme` — no hardcoded values
- **Builds on `@repo/ui` components** — consistent look, less duplication
- **Has test coverage** — smoke tests, integration tests, and E2E for critical flows
- **Supports billing metadata** — tier and feature flags ready for future monetization

## Strategy

Work proceeds in seven milestones across three focus areas:

### 1. Quality Baseline (M1, M7)
Lay shared infrastructure first: test framework, billing package, typed DB helpers, universal auth middleware. Cap the project with deep test coverage and CI enforcement.

### 2. Design Consistency (M3 → M4 → M5 → M6)
Audit and fix theme token violations across all apps, then migrate to shared UI components in three batches ordered by app maturity — most-complete apps first, stubs and showcase apps last. Command Center's 21 sub-modules get dedicated attention in M6.

### 3. Auth & Access (M2)
Mechanically gate all 13 currently-public apps behind login, leveraging the updated middleware from M1. Repetitive, well-scoped work ideal for batch execution.

## Execution Model

This roadmap is designed for **Alpha Loop** — an autonomous agent that processes milestones as sessions, creating PRs from individual issues. M2 and M3 run in parallel after M1 completes. M4-M6 are sequential. M7 is the capstone.

## Principles

- **Shared work lands first.** Cross-cutting packages and middleware before app-specific changes.
- **Consistency before beauty.** Theme tokens before component migration.
- **Every change includes tests.** No issue ships without smoke test coverage.
- **Preserve personality.** Showcase apps keep their unique character; only primitives and tokens get standardized.
- **Infrastructure, not enforcement.** Billing is plumbing-only — no runtime paywalls until the platform is solid.

## Scale

~85 issues across 7 milestones, touching 27 apps, 5 shared packages, and establishing CI from scratch.
