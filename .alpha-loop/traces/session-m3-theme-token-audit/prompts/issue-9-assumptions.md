You just implemented GitHub issue #9: Audit and document token usage violations

## Original Requirements
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

## Code Changes (first 5000 chars)
diff --git a/docs/token-violations-report.md b/docs/token-violations-report.md
new file mode 100644
index 0000000..96f8520
--- /dev/null
+++ b/docs/token-violations-report.md
@@ -0,0 +1,1871 @@
+# Token Usage Violations Report
+
+> Generated: 2026-04-08
+> Scanned: `apps/web/app/apps/` (27 apps)
+> Total violations: **1525**
+
+## Summary
+
+| Severity | Count |
+|----------|-------|
+| High (inline hex/rgb/oklch) | 593 |
+| Medium (Tailwind hardcoded colors) | 932 |
+| Low | 0 |
+
+| Violation Type | Count |
+|----------------|-------|
+| Color | 1512 |
+| Shadow | 10 |
+| Border Radius | 3 |
+| Font Family | 0 |
+
+## Per-App Summary
+
+| App | Total | Color | Shadow | Radius | Font | High | Medium | Low |
+|-----|-------|-------|--------|--------|------|------|--------|-----|
+| command-center | 560 | 559 | 1 | 0 | 0 | 309 | 251 | 0 |
+| cringe-rizzler | 111 | 108 | 3 | 0 | 0 | 64 | 47 | 0 |
+| soccer-training | 72 | 72 | 0 | 0 | 0 | 1 | 71 | 0 |
+| hspt-tutor | 60 | 60 | 0 | 0 | 0 | 17 | 43 | 0 |
+| ai-calculator | 58 | 58 | 0 | 0 | 0 | 0 | 58 | 0 |
+| proper-wine-pour | 56 | 55 | 1 | 0 | 0 | 39 | 17 | 0 |
+| slang-translator | 56 | 55 | 1 | 0 | 0 | 21 | 35 | 0 |
+| sprint-planning | 54 | 54 | 0 | 0 | 0 | 5 | 49 | 0 |
+| roblox-dances | 53 | 53 | 0 | 0 | 0 | 1 | 52 | 0 |
+| meeting-summaries | 50 | 50 | 0 | 0 | 0 | 0 | 50 | 0 |
+| summaries | 50 | 50 | 0 | 0 | 0 | 0 | 50 | 0 |
+| accounts | 49 | 49 | 0 | 0 | 0 | 0 | 49 | 0 |
+| hspt-practice | 45 | 45 | 0 | 0 | 0 | 12 | 33 | 0 |
+| brommie-quake | 41 | 41 | 0 | 0 | 0 | 41 | 0 | 0 |
+| dad-joke-of-the-day | 35 | 35 | 0 | 0 | 0 | 1 | 34 | 0 |
+| sentiment | 30 | 28 | 0 | 2 | 0 | 20 | 10 | 0 |
+| generations | 24 | 23 | 1 | 0 | 0 | 13 | 11 | 0 |
+| daily-updates | 23 | 23 | 0 | 0 | 0 | 12 | 11 | 0 |
+| superstars | 23 | 22 | 1 | 0 | 0 | 23 | 0 | 0 |
+| age-of-apes | 18 | 18 | 0 | 0 | 0 | 8 | 10 | 0 |
+| uptime | 18 | 18 | 0 | 0 | 0 | 0 | 18 | 0 |
+| alpha-wins | 16 | 14 | 1 | 1 | 0 | 2 | 14 | 0 |
+| standup | 12 | 12 | 0 | 0 | 0 | 0 | 12 | 0 |
+| travel-collection | 9 | 8 | 1 | 0 | 0 | 2 | 7 | 0 |
+| area-52 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
+| lighthouse | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
+| sales | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
+
+## Available Theme Tokens
+
+Use these tokens instead of hardcoded values. Defined in `packages/theme/src/theme.css`.
+
+### Colors
+- **Accent**: `--color-accent`, `--color-accent-50` through `--color-accent-900`
+- **Navy**: `--color-navy`, `--color-navy-50` through `--color-navy-950`
+- **Status**: `--color-green`, `--color-yellow`, `--color-red`, `--color-orange`, `--color-blue`
+- **Surface**: `--color-surface`, `--color-surface-hover`, `--color-surface-active`, `--color-surface-border`
+- **Semantic**: `--color-background`, `--color-foreground`, `--color-card`, `--color-primary`, `--color-secondary`, `--color-muted`, `--color-destructive`, `--color-border`, `--color-input`, `--color-ring`
+- **Pill palette**: `--color-pill-0` through `--color-pill-9`
+- **Neon icons**: `--color-neon-amber`, `--color-neon-violet`, `--color-neon-blue`, `--color-neon-green`, `--color-neon-pink`, `--color-neon-cyan`
+
+### Gradients
+- `--gradient-navy`, `--gradient-navy-3`, `--gradient-accent`
+
+### Shadows
+- `--shadow-glass`, `--shadow-glass-sm`, `--shadow-glass-hover`
+- `--shadow-glow`, `--shadow-glow-accent`
+
+### Border Radius
+- `--radius-glass` (12px), `--radius` (0.75rem)
+
+### Fonts
+- `--font-sans`, `--font-mono`, `--font-heading`
+
+### Blur
+- `--blur-glass`, `--blur-glass-strong`
+
+## Per-App Violation Details
+
+### command-center (560 violations)
+
+**High severity** (309)
+
+| File | Line | Type | Value |
+|------|------|------|-------|
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 18 | color | `#4ade80` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 18 | color | `#4ade80` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 18 | color | `rgba(34,197,94...)` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 19 | color | `#fbbf24` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 19 | color | `#f59e0b` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 19 | color | `rgba(245,158,11...)` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 20 | color | `#94a3b8` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 20 | color | `#64748b` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 20 | color | `rgba(100,116,139...)` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 21 | color | `#f87171` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 21 | color | `#ef4444` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 21 | color | `rgba(239,68,68...)` |
+| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 79 | color |

## Review Summary
Token audit script fully meets all acceptance criteria; dead code removed during review

Analyze the implementation and list any assumptions or decisions you had to make where the requirements were ambiguous or incomplete. Output ONLY a markdown document with this structure:

## Assumptions
- (list each assumption made, e.g. "Assumed the date format should be ISO 8601 since it wasn't specified")
- If no assumptions were needed, write "None — requirements were fully specified"

## Decisions
- (list each design/implementation decision where multiple valid approaches existed, e.g. "Chose to validate on the server side rather than client side for security")
- If no notable decisions, write "None — implementation was straightforward"

## Items to Validate
- (list specific things the user should check, e.g. "Verify the error message wording matches your team's style guide")
- If nothing needs validation, write "None"

Keep it concise. Only include genuinely ambiguous items, not obvious implementation choices.