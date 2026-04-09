The code review for issue #68 found problems that need to be fixed.

## Code Review Findings (MUST FIX)

Batch 1 made meaningful progress on command-center sub-apps, daily-updates, sprint-planning (partial), and sentiment (partial), but 5 of 10 listed apps are untouched and no visual regression snapshots were created. Four bugs were found and fixed (color collisions, confetti keyframe, hardcoded hex).

- [CRITICAL] (apps/web/app/apps/accounts/components/accounts-app.tsx) Acceptance criterion 'No hardcoded hex/rgb/oklch color values in any listed app' not met: accounts, standup, summaries, meeting-summaries, and uptime apps received zero changes. Combined they have ~179 token violations per the audit report.
- [CRITICAL] (N/A) Acceptance criterion 'Visual regression baseline snapshot per app' not met: no visual test infrastructure, no Playwright visual comparison config, and no baseline screenshots were created for any app.
- [CRITICAL] (apps/web/app/apps/sprint-planning/components/sprint-app.tsx) sprint-planning partially fixed: SERVICE_COLORS converted but STATUS_DOT_COLORS and PRIORITY_COLORS still use Tailwind palette classes (bg-red-500, bg-amber-500, bg-purple-500, etc.).
- [CRITICAL] (apps/web/app/apps/sentiment/components/mood-badge.tsx) sentiment partially fixed: sentiment-chart.tsx converted but mood-badge.tsx and timeline.tsx still use raw Tailwind palette classes (bg-green-500/20, text-purple-400, etc.).
- [CRITICAL] (apps/web/app/apps/daily-updates/components/feed-app.tsx) daily-updates partially fixed: APP_NEON_COLORS converted but feed-app.tsx lines ~169 and ~341 still have hardcoded border-amber-500/40, bg-amber-500/10, bg-amber-500 classes.
- [WARNING] (N/A) Commit message says 'closes #68' but title says 'batch 1' — contradictory. If this is truly batch 1, the commit should not auto-close the issue.
- [INFO] (docs/token-violations-report.md) token-violations-report.md was generated before the batch 1 fixes and is now stale — it still lists violations that were fixed in this branch. Should be regenerated after all fixes.
- [INFO] (packages/theme/src/theme.css) theme.css shadow tokens (shadow-glow-accent-sm, shadow-glow-accent-md) use hardcoded rgba(245, 158, 11, ...) instead of referencing var(--color-accent), creating drift risk if accent color changes.
- [INFO] (packages/theme/src/theme.css) Brand token hex values in theme.css use inconsistent casing: --color-brand-jira uses #0052CC (uppercase) while --color-brand-linkedin uses #0a66c2 (lowercase).

Instructions:
1. Address each finding listed above
2. Run tests to make sure nothing is broken
3. Commit your fixes with: git commit -m "fix(#68): address review findings"