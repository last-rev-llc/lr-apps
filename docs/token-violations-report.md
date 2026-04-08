# Token Usage Violations Report

> Generated: 2026-04-08
> Scanned: `apps/web/app/apps/` (27 apps)
> Total violations: **1525**

## Summary

| Severity | Count |
|----------|-------|
| High (inline hex/rgb/oklch) | 593 |
| Medium (Tailwind hardcoded colors) | 932 |
| Low | 0 |

| Violation Type | Count |
|----------------|-------|
| Color | 1512 |
| Shadow | 10 |
| Border Radius | 3 |
| Font Family | 0 |

## Per-App Summary

| App | Total | Color | Shadow | Radius | Font | High | Medium | Low |
|-----|-------|-------|--------|--------|------|------|--------|-----|
| command-center | 560 | 559 | 1 | 0 | 0 | 309 | 251 | 0 |
| cringe-rizzler | 111 | 108 | 3 | 0 | 0 | 64 | 47 | 0 |
| soccer-training | 72 | 72 | 0 | 0 | 0 | 1 | 71 | 0 |
| hspt-tutor | 60 | 60 | 0 | 0 | 0 | 17 | 43 | 0 |
| ai-calculator | 58 | 58 | 0 | 0 | 0 | 0 | 58 | 0 |
| proper-wine-pour | 56 | 55 | 1 | 0 | 0 | 39 | 17 | 0 |
| slang-translator | 56 | 55 | 1 | 0 | 0 | 21 | 35 | 0 |
| sprint-planning | 54 | 54 | 0 | 0 | 0 | 5 | 49 | 0 |
| roblox-dances | 53 | 53 | 0 | 0 | 0 | 1 | 52 | 0 |
| meeting-summaries | 50 | 50 | 0 | 0 | 0 | 0 | 50 | 0 |
| summaries | 50 | 50 | 0 | 0 | 0 | 0 | 50 | 0 |
| accounts | 49 | 49 | 0 | 0 | 0 | 0 | 49 | 0 |
| hspt-practice | 45 | 45 | 0 | 0 | 0 | 12 | 33 | 0 |
| brommie-quake | 41 | 41 | 0 | 0 | 0 | 41 | 0 | 0 |
| dad-joke-of-the-day | 35 | 35 | 0 | 0 | 0 | 1 | 34 | 0 |
| sentiment | 30 | 28 | 0 | 2 | 0 | 20 | 10 | 0 |
| generations | 24 | 23 | 1 | 0 | 0 | 13 | 11 | 0 |
| daily-updates | 23 | 23 | 0 | 0 | 0 | 12 | 11 | 0 |
| superstars | 23 | 22 | 1 | 0 | 0 | 23 | 0 | 0 |
| age-of-apes | 18 | 18 | 0 | 0 | 0 | 8 | 10 | 0 |
| uptime | 18 | 18 | 0 | 0 | 0 | 0 | 18 | 0 |
| alpha-wins | 16 | 14 | 1 | 1 | 0 | 2 | 14 | 0 |
| standup | 12 | 12 | 0 | 0 | 0 | 0 | 12 | 0 |
| travel-collection | 9 | 8 | 1 | 0 | 0 | 2 | 7 | 0 |
| area-52 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| lighthouse | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| sales | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Available Theme Tokens

Use these tokens instead of hardcoded values. Defined in `packages/theme/src/theme.css`.

### Colors
- **Accent**: `--color-accent`, `--color-accent-50` through `--color-accent-900`
- **Navy**: `--color-navy`, `--color-navy-50` through `--color-navy-950`
- **Status**: `--color-green`, `--color-yellow`, `--color-red`, `--color-orange`, `--color-blue`
- **Surface**: `--color-surface`, `--color-surface-hover`, `--color-surface-active`, `--color-surface-border`
- **Semantic**: `--color-background`, `--color-foreground`, `--color-card`, `--color-primary`, `--color-secondary`, `--color-muted`, `--color-destructive`, `--color-border`, `--color-input`, `--color-ring`
- **Pill palette**: `--color-pill-0` through `--color-pill-9`
- **Neon icons**: `--color-neon-amber`, `--color-neon-violet`, `--color-neon-blue`, `--color-neon-green`, `--color-neon-pink`, `--color-neon-cyan`

### Gradients
- `--gradient-navy`, `--gradient-navy-3`, `--gradient-accent`

### Shadows
- `--shadow-glass`, `--shadow-glass-sm`, `--shadow-glass-hover`
- `--shadow-glow`, `--shadow-glow-accent`

### Border Radius
- `--radius-glass` (12px), `--radius` (0.75rem)

### Fonts
- `--font-sans`, `--font-mono`, `--font-heading`

### Blur
- `--blur-glass`, `--blur-glass-strong`

## Per-App Violation Details

### command-center (560 violations)

**High severity** (309)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 18 | color | `#4ade80` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 18 | color | `#4ade80` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 18 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 19 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 19 | color | `#f59e0b` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 19 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 20 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 20 | color | `#64748b` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 20 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 21 | color | `#f87171` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 21 | color | `#ef4444` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 21 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 79 | color | `#e2e8f0` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 80 | color | `#4ade80` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 81 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 82 | color | `#f87171` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 17 | color | `#60a5fa` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 17 | color | `rgba(59,130,246...)` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 18 | color | `#facc15` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 18 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 19 | color | `#4ade80` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 19 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 20 | color | `#c084fc` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 20 | color | `rgba(168,85,247...)` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 21 | color | `#fb923c` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 21 | color | `rgba(249,115,22...)` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 93 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 93 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 37 | color | `#4ade80` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 37 | color | `#4ade80` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 38 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 38 | color | `#f59e0b` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 39 | color | `#f87171` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 39 | color | `#ef4444` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 55 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 56 | color | `#4ade80` |
| `apps/web/app/apps/command-center/alphaclaw/components/alphaclaw-app.tsx` | 57 | color | `#60a5fa` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 8 | color | `#f87171` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 8 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 9 | color | `#facc15` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 9 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 10 | color | `#4ade80` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 10 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 10 | color | `#4ade80` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 10 | color | `#4ade80` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 10 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 10 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 11 | color | `#f87171` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 11 | color | `#f87171` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 11 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 11 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 12 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 12 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 12 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 12 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 37 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 38 | color | `#4ade80` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 39 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 40 | color | `#f87171` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 44 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 45 | color | `#4ade80` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 46 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 47 | color | `#f87171` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 59 | shadow | `0 0 6px ${s.dot}80` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 74 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 76 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 77 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 79 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 81 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 82 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 83 | color | `#4ade80` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 83 | color | `#f87171` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 83 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 176 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 176 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 18 | color | `#4ade80` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 18 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 19 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 19 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 20 | color | `#f87171` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 20 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 21 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 21 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 13 | color | `#4ade80` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 13 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 14 | color | `#60a5fa` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 14 | color | `rgba(59,130,246...)` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 15 | color | `#facc15` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 15 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 16 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 16 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 65 | color | `#e2e8f0` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 66 | color | `#60a5fa` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 67 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 68 | color | `#f87171` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 68 | color | `#4ade80` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 29 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 30 | color | `#4ade80` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 31 | color | `#4ade80` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 35 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 36 | color | `#f87171` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 37 | color | `#ef4444` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 41 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 42 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 43 | color | `#f59e0b` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 47 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 48 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 49 | color | `#64748b` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 55 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 56 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 57 | color | `#64748b` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 29 | color | `#3b82f6` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 29 | color | `rgba(59,130,246...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 30 | color | `#8b5cf6` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 30 | color | `rgba(139,92,246...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 31 | color | `#f59e0b` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 31 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 32 | color | `#22c55e` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 32 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 33 | color | `#ef4444` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 33 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 34 | color | `#facc15` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 34 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 51 | color | `rgba(113,113,122...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 51 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 105 | color | `rgba(113,113,122...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 106 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 145 | color | `rgba(113,113,122...)` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 146 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 38 | color | `#a855f7` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 39 | color | `#14b8a6` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 40 | color | `#eab308` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 41 | color | `#3b82f6` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 42 | color | `#ec4899` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 43 | color | `#f97316` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 47 | color | `#3b82f6` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 48 | color | `#6b7280` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 49 | color | `#f97316` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 50 | color | `#22c55e` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 51 | color | `#6b7280` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 55 | color | `#22c55e` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 56 | color | `#eab308` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 57 | color | `#ef4444` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 61 | color | `#6366f1` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 62 | color | `#a855f7` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 63 | color | `#eab308` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 476 | color | `#1e1e2e` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 578 | color | `#6b7280` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 579 | color | `#6b7280` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 580 | color | `#6b7280` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 644 | color | `#3b82f6` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 649 | color | `#22c55e` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 701 | color | `#6b7280` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 47 | color | `#4ade80` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 48 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 49 | color | `#f87171` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 50 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 53 | color | `#4ade80` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 53 | color | `#4ade80` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 54 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 54 | color | `#f59e0b` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 55 | color | `#f87171` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 55 | color | `#ef4444` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 75 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 75 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 76 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/iron/components/iron-app.tsx` | 76 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 42 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 43 | color | `#4ade80` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 44 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 48 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 49 | color | `#facc15` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 50 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 53 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 54 | color | `#f87171` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 55 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 313 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 313 | color | `rgba(124,58,237...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 315 | color | `rgba(113,113,122...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 316 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 463 | color | `#facc15` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 463 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 487 | color | `#0a66c2` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 15 | color | `#0d0d0d` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 15 | color | `#ffffff` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 16 | color | `#001a00` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 16 | color | `#00ff41` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 17 | color | `#1a0533` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 17 | color | `#ff71ce` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 18 | color | `#1a0a00` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 18 | color | `#ff6b35` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 19 | color | `#001a2e` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 19 | color | `#7dd8ff` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 20 | color | `#ffffff` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 20 | color | `#000000` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 95 | color | `#000000` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 13 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 14 | color | `#4ade80` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 15 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 16 | color | `#4ade80` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 19 | color | `rgba(139,92,246...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 20 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 21 | color | `rgba(139,92,246...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 22 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 25 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 26 | color | `#f87171` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 27 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 28 | color | `#f87171` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 46 | color | `#60a5fa` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 46 | color | `rgba(59,130,246...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 47 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 47 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 48 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 48 | color | `rgba(139,92,246...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 49 | color | `#4ade80` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 49 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 50 | color | `#f87171` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 50 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 51 | color | `#2dd4bf` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 51 | color | `rgba(20,184,166...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 26 | color | `#818cf8` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 26 | color | `rgba(99,102,241...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 27 | color | `#34d399` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 27 | color | `rgba(16,185,129...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 28 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 28 | color | `rgba(245,158,11...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 29 | color | `#f87171` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 29 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 131 | color | `#12121e` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 165 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 166 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 274 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 275 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 342 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 343 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 10 | color | `#4ade80` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 11 | color | `#60a5fa` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 12 | color | `#f87171` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 13 | color | `#fb923c` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 14 | color | `#7dd8ff` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 15 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 16 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 17 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 18 | color | `#e2e8f0` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 8 | color | `#f87171` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 8 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 9 | color | `#4ade80` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 9 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 10 | color | `#facc15` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 10 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 11 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 11 | color | `rgba(100,116,139...)` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 15 | color | `#4ade80` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 15 | color | `#4ade80` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 16 | color | `#fbbf24` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 16 | color | `#f59e0b` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 17 | color | `#94a3b8` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 17 | color | `#64748b` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 18 | color | `#f87171` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 18 | color | `#ef4444` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 37 | color | `#4ade80` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 38 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 39 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 42 | color | `#facc15` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 43 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 44 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 47 | color | `#f87171` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 48 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 49 | color | `rgba(239,68,68...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 75 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 76 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 77 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 341 | color | `#0a66c2` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 342 | color | `#0a66c2` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 342 | color | `#0a66c2` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 375 | color | `#4a154b` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 376 | color | `#e01e5a` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 376 | color | `#e01e5a` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 505 | color | `rgba(124,58,237...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 506 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 507 | color | `rgba(124,58,237...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 510 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 511 | color | `#4ade80` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 512 | color | `rgba(34,197,94...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 515 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 516 | color | `#facc15` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 517 | color | `rgba(234,179,8...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 520 | color | `rgba(14,165,233...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 521 | color | `#38bdf8` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 522 | color | `rgba(14,165,233...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 525 | color | `rgba(249,115,22...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 526 | color | `#fb923c` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 527 | color | `rgba(249,115,22...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 530 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 531 | color | `#f472b6` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 532 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 535 | color | `rgba(20,184,166...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 536 | color | `#2dd4bf` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 537 | color | `rgba(20,184,166...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 541 | color | `rgba(113,113,122...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 542 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 543 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 291 | color | `#0a66c2` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 315 | color | `#e01e5a` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 324 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 324 | color | `rgba(124,58,237...)` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 373 | color | `rgba(124,58,237...)` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 374 | color | `#a78bfa` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 375 | color | `rgba(124,58,237...)` |

**Medium severity** (251)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/command-center/page.tsx` | 158 | color | `bg-green-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 158 | color | `text-green-400` |
| `apps/web/app/apps/command-center/page.tsx` | 158 | color | `border-green-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 159 | color | `bg-purple-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 159 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/page.tsx` | 159 | color | `border-purple-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 160 | color | `bg-blue-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 160 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/page.tsx` | 160 | color | `border-blue-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 161 | color | `bg-yellow-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 161 | color | `text-yellow-400` |
| `apps/web/app/apps/command-center/page.tsx` | 161 | color | `border-yellow-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 162 | color | `bg-red-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 162 | color | `text-red-400` |
| `apps/web/app/apps/command-center/page.tsx` | 162 | color | `border-red-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 163 | color | `bg-cyan-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 163 | color | `text-cyan-400` |
| `apps/web/app/apps/command-center/page.tsx` | 163 | color | `border-cyan-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 164 | color | `bg-orange-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 164 | color | `text-orange-400` |
| `apps/web/app/apps/command-center/page.tsx` | 164 | color | `border-orange-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 165 | color | `bg-pink-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 165 | color | `text-pink-400` |
| `apps/web/app/apps/command-center/page.tsx` | 165 | color | `border-pink-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 166 | color | `bg-indigo-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 166 | color | `text-indigo-400` |
| `apps/web/app/apps/command-center/page.tsx` | 166 | color | `border-indigo-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 216 | color | `bg-zinc-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 216 | color | `text-zinc-400` |
| `apps/web/app/apps/command-center/page.tsx` | 216 | color | `border-zinc-500/20` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 103 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 103 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 103 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 150 | color | `text-red-400` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 150 | color | `bg-red-500/5` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 78 | color | `border-purple-500/60` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 78 | color | `bg-purple-500/15` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 78 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 83 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 83 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 83 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 173 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 173 | color | `bg-purple-500/10` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 202 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 202 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 127 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 173 | color | `bg-amber-500/10` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 247 | color | `border-amber-500/30` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 247 | color | `bg-amber-500/8` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 248 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 256 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 276 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 276 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 276 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 294 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 294 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/client-health/components/health-app.tsx` | 294 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 81 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 81 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 81 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 125 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 125 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 125 | color | `border-amber-500/30` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 125 | color | `bg-amber-500/10` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 124 | color | `text-green-400` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 125 | color | `text-yellow-400` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 126 | color | `text-red-400` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 142 | color | `bg-green-500/60` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 143 | color | `bg-yellow-500/60` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 144 | color | `bg-red-500/60` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 151 | color | `text-yellow-400` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 170 | color | `text-green-400` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 208 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/contentful/components/contentful-app.tsx` | 208 | color | `text-purple-300` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 184 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 184 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 184 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 311 | color | `bg-green-500/25` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 311 | color | `border-green-500/40` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 318 | color | `bg-green-400` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 346 | color | `text-green-400/70` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 75 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 133 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 217 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 217 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 235 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 235 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 235 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 358 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 358 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 386 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 386 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 469 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 592 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 711 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 158 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 158 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 158 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 174 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 174 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 174 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 274 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 274 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 283 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 283 | color | `text-blue-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 293 | color | `text-sky-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 293 | color | `text-sky-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 378 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 378 | color | `text-blue-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 474 | color | `bg-blue-500/10` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 474 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 41 | color | `bg-green-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 41 | color | `text-green-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 41 | color | `border-green-500/20` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 42 | color | `bg-red-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 42 | color | `text-red-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 42 | color | `border-red-500/20` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 43 | color | `bg-gray-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 43 | color | `border-gray-500/20` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 69 | color | `border-amber-500/30` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 84 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 84 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 88 | color | `bg-blue-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 88 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 93 | color | `bg-red-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 93 | color | `text-red-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 117 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 127 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 145 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 156 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 168 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 175 | color | `bg-purple-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 175 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 198 | color | `bg-red-500/15` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 198 | color | `text-red-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 198 | color | `border-red-500/20` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 199 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 199 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 199 | color | `border-amber-500/20` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 200 | color | `bg-green-500/15` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 200 | color | `text-green-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 200 | color | `border-green-500/20` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 216 | color | `bg-amber-500/12` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 216 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 234 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 234 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 242 | color | `border-green-500/40` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 242 | color | `bg-green-500/8` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 355 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 369 | color | `bg-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 369 | color | `border-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 370 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 402 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 411 | color | `bg-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 411 | color | `border-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 412 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 426 | color | `bg-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 426 | color | `border-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 427 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 158 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 168 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 179 | color | `accent-amber-500` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 196 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 196 | color | `bg-amber-500/10` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 196 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 215 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 215 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 215 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 215 | color | `bg-amber-500/30` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 92 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 211 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 211 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 211 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 225 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 228 | color | `bg-zinc-900` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 240 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 243 | color | `bg-zinc-900` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 207 | color | `text-amber-400/80` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 227 | color | `text-amber-400/80` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 118 | color | `border-purple-500/60` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 118 | color | `bg-purple-500/15` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 118 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 139 | color | `text-amber-400/80` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 163 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 187 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 121 | color | `bg-green-500/70` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 140 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 148 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 164 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 164 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 164 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 164 | color | `bg-amber-500/30` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 178 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 178 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 178 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 192 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 192 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 192 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 214 | color | `border-red-500/30` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 214 | color | `bg-red-500/10` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 214 | color | `text-red-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 214 | color | `bg-red-500/20` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 254 | color | `border-green-500` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 254 | color | `bg-green-500/30` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 258 | color | `text-green-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 274 | color | `text-red-400` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 79 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 79 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 79 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 94 | color | `border-purple-500/60` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 94 | color | `bg-purple-500/15` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 94 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 113 | color | `border-amber-500/25` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 113 | color | `bg-amber-500/8` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 114 | color | `text-amber-300/90` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 146 | color | `text-green-400/70` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 152 | color | `text-green-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 160 | color | `text-red-400/70` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 166 | color | `text-red-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 188 | color | `bg-blue-500/12` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 188 | color | `text-blue-300` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 200 | color | `bg-purple-500/12` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 200 | color | `text-purple-300` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 212 | color | `bg-green-500/12` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 212 | color | `text-green-300` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 232 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 245 | color | `border-red-500/25` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 245 | color | `bg-red-500/8` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 245 | color | `text-red-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 268 | color | `bg-zinc-950/95` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 277 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 277 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 306 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 306 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 361 | color | `text-sky-400` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 362 | color | `bg-sky-500/10` |
| `apps/web/app/apps/command-center/users/components/contact-detail.tsx` | 362 | color | `border-sky-500/25` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 146 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 164 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 164 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 164 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 191 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 191 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 191 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 250 | color | `border-amber-500/30` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 259 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 259 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 309 | color | `text-sky-400` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 340 | color | `border-amber-500/25` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 345 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 345 | color | `text-amber-300` |

### cringe-rizzler (111 violations)

**High severity** (64)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 14 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 20 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 26 | color | `#22c55e` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 32 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 38 | color | `#3b82f6` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 44 | color | `#f43f5e` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 53 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 59 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 65 | color | `#22c55e` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 98 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 98 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 98 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 114 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 114 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 115 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 115 | shadow | `0 0 24px rgba(236,72,153,0.4)` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 177 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 177 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 179 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 179 | color | `#3b82f6` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 180 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 180 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 242 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 242 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 243 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 243 | shadow | `0 0 24px rgba(236,72,153,0.4)` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 22 | color | `#22c55e` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 23 | color | `#eab308` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 24 | color | `#ef4444` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 47 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 48 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 49 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 50 | color | `#22c55e` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 51 | color | `#3b82f6` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 52 | color | `#f43f5e` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 53 | color | `#fb7185` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 54 | color | `#fb923c` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 55 | color | `#c084fc` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 56 | color | `#34d399` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 57 | color | `#60a5fa` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 58 | color | `#fbbf24` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 60 | color | `#94a3b8` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 138 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 139 | color | `#f9a8d4` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 140 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 184 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 184 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 185 | color | `rgba(236,72,153...)` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 185 | shadow | `0 0 20px rgba(236,72,153,0.4)` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 314 | color | `#ffffff` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 315 | color | `#000000` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 508 | color | `#0d0d1a` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 556 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 556 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 556 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 11 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 18 | color | `#0d0d1a` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 18 | color | `#12091e` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 18 | color | `#0a0d1a` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 27 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 31 | color | `#a855f7` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 35 | color | `#f59e0b` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 46 | color | `#ec4899` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 46 | color | `#a855f7` |

**Medium severity** (47)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 92 | color | `text-pink-400` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 120 | color | `border-pink-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 124 | color | `border-pink-400` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 148 | color | `text-red-400` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 153 | color | `bg-pink-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 153 | color | `bg-pink-500/30` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 153 | color | `text-pink-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 153 | color | `border-pink-500/30` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 153 | color | `border-pink-400/50` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 160 | color | `bg-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 160 | color | `bg-violet-500/30` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 160 | color | `text-violet-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 160 | color | `border-violet-500/30` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 160 | color | `border-violet-400/50` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 172 | color | `text-red-400` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 212 | color | `bg-pink-500/10` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 212 | color | `text-pink-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 377 | color | `border-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 377 | color | `bg-violet-500/10` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 377 | color | `bg-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 377 | color | `border-violet-400/40` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 377 | color | `text-violet-200` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 385 | color | `border-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 387 | color | `border-violet-400` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 394 | color | `border-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 404 | color | `bg-violet-500/10` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 404 | color | `text-violet-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 417 | color | `border-violet-400/50` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 417 | color | `bg-violet-500/10` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 417 | color | `text-violet-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 430 | color | `border-violet-400/50` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 430 | color | `bg-violet-500/10` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 430 | color | `text-violet-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 464 | color | `bg-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 464 | color | `bg-violet-500/30` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 464 | color | `text-violet-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 464 | color | `border-violet-500/30` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 500 | color | `border-pink-500/50` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 505 | color | `border-pink-500/50` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 573 | color | `bg-pink-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 573 | color | `text-pink-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 579 | color | `bg-violet-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 579 | color | `text-violet-300` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 585 | color | `bg-amber-500/20` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 585 | color | `text-amber-300` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 57 | color | `text-pink-400` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 63 | color | `text-pink-400` |

### soccer-training (72 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/soccer-training/layout.tsx` | 10 | color | `#22c55e` |

**Medium severity** (71)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 11 | color | `bg-green-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 11 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 11 | color | `border-green-500/30` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 12 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 12 | color | `text-yellow-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 12 | color | `border-yellow-500/30` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 13 | color | `bg-red-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 13 | color | `text-red-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 13 | color | `border-red-500/30` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 17 | color | `bg-orange-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 17 | color | `text-orange-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 18 | color | `bg-blue-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 18 | color | `text-blue-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 19 | color | `bg-blue-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 19 | color | `text-blue-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 20 | color | `bg-purple-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 20 | color | `text-purple-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 21 | color | `bg-purple-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 21 | color | `text-purple-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 22 | color | `bg-pink-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 22 | color | `text-pink-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 23 | color | `bg-red-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 23 | color | `text-red-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 24 | color | `bg-red-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 24 | color | `text-red-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 25 | color | `bg-green-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 25 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 26 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 26 | color | `text-yellow-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 27 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 27 | color | `text-yellow-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 28 | color | `bg-cyan-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 28 | color | `text-cyan-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 29 | color | `bg-rose-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 29 | color | `text-rose-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 30 | color | `bg-rose-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 30 | color | `text-rose-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 31 | color | `bg-rose-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 31 | color | `text-rose-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 32 | color | `bg-teal-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 32 | color | `text-teal-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 33 | color | `bg-teal-500/15` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 33 | color | `text-teal-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 67 | color | `bg-green-500/90` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 67 | color | `bg-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 84 | color | `border-green-500/40` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 101 | color | `bg-green-500/90` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 115 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 207 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 216 | color | `text-green-500` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 246 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 246 | color | `text-green-300` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 340 | color | `border-green-500/50` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 352 | color | `bg-green-500` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 371 | color | `bg-green-500/30` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 371 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 371 | color | `border-green-500/50` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 373 | color | `bg-yellow-500/30` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 373 | color | `text-yellow-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 373 | color | `border-yellow-500/50` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 375 | color | `bg-red-500/30` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 375 | color | `text-red-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 375 | color | `border-red-500/50` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 416 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/components/drill-library.tsx` | 416 | color | `text-green-300` |
| `apps/web/app/apps/soccer-training/layout.tsx` | 24 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/layout.tsx` | 31 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/layout.tsx` | 37 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/page.tsx` | 25 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/page.tsx` | 31 | color | `text-green-400` |
| `apps/web/app/apps/soccer-training/page.tsx` | 37 | color | `text-green-400` |

### hspt-tutor (60 violations)

**High severity** (17)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 41 | color | `#f59e0b` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 47 | color | `#3b82f6` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 53 | color | `#10b981` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 59 | color | `#ef4444` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 65 | color | `#a855f7` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 196 | color | `#10b981` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 196 | color | `#f59e0b` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 196 | color | `#ef4444` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 210 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 256 | color | `#10b981` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 822 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 826 | color | `#888` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 831 | color | `#888` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 837 | color | `rgba(0,0,0...)` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 838 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 847 | color | `#10b981` |
| `apps/web/app/apps/hspt-tutor/layout.tsx` | 10 | color | `#10B981` |

**Medium severity** (43)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 40 | color | `text-amber-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 46 | color | `text-blue-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 52 | color | `text-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 58 | color | `text-red-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 64 | color | `text-purple-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 123 | color | `text-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 124 | color | `text-amber-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 125 | color | `text-red-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 129 | color | `border-emerald-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 130 | color | `border-amber-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 131 | color | `border-red-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 135 | color | `bg-emerald-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 136 | color | `bg-amber-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 137 | color | `bg-red-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 328 | color | `text-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 343 | color | `bg-emerald-600` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 343 | color | `bg-emerald-700` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 550 | color | `bg-emerald-600` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 550 | color | `bg-emerald-700` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 608 | color | `bg-emerald-600` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 608 | color | `bg-emerald-700` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 631 | color | `bg-emerald-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 632 | color | `bg-red-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 634 | color | `bg-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 675 | color | `border-emerald-500/50` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 678 | color | `border-emerald-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 678 | color | `bg-emerald-500/15` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 681 | color | `border-red-500` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 681 | color | `bg-red-500/15` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 696 | color | `text-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 699 | color | `text-red-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 711 | color | `bg-emerald-500/10` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 711 | color | `border-emerald-500/40` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 712 | color | `bg-red-500/10` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 712 | color | `border-red-500/40` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 717 | color | `text-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 722 | color | `text-red-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 733 | color | `bg-emerald-600` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 733 | color | `bg-emerald-700` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 801 | color | `bg-emerald-500/15` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 801 | color | `text-emerald-400` |
| `apps/web/app/apps/hspt-tutor/components/tutor-app.tsx` | 801 | color | `border-emerald-500/40` |
| `apps/web/app/apps/hspt-tutor/page.tsx` | 9 | color | `text-emerald-400` |

### ai-calculator (58 violations)

**Medium severity** (58)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 147 | color | `text-purple-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 151 | color | `text-gray-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 179 | color | `text-gray-400` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 185 | color | `text-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 194 | color | `text-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 203 | color | `text-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 212 | color | `text-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 237 | color | `text-gray-400` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 251 | color | `text-gray-400` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 265 | color | `text-gray-400` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 281 | color | `text-gray-400` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 288 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 288 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 288 | color | `from-cyan-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 288 | color | `to-purple-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 300 | color | `text-purple-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 307 | color | `from-purple-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 307 | color | `to-blue-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 307 | color | `border-purple-100` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 308 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 308 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 311 | color | `text-gray-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 315 | color | `from-purple-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 315 | color | `to-blue-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 315 | color | `border-purple-100` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 316 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 316 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 319 | color | `text-gray-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 323 | color | `from-purple-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 323 | color | `to-blue-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 323 | color | `border-purple-100` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 324 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 324 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 327 | color | `text-gray-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 332 | color | `bg-gray-50` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 332 | color | `text-gray-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 333 | color | `text-gray-800` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 359 | color | `border-gray-200` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 379 | color | `text-gray-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 397 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 397 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 397 | color | `from-cyan-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 397 | color | `to-purple-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 406 | color | `text-green-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 406 | color | `text-red-600` |
| `apps/web/app/apps/ai-calculator/(protected)/calculator/page.tsx` | 414 | color | `text-gray-400` |
| `apps/web/app/apps/ai-calculator/layout.tsx` | 15 | color | `bg-gray-50` |
| `apps/web/app/apps/ai-calculator/layout.tsx` | 16 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/layout.tsx` | 16 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 35 | color | `text-purple-600` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 38 | color | `text-gray-900` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 41 | color | `text-gray-600` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 48 | color | `border-purple-100` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 50 | color | `text-gray-900` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 61 | color | `from-cyan-500` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 61 | color | `to-purple-500` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 61 | color | `from-cyan-600` |
| `apps/web/app/apps/ai-calculator/page.tsx` | 61 | color | `to-purple-600` |

### proper-wine-pour (56 violations)

**High severity** (39)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 5 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 17 | color | `rgba(114,47,55...)` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 17 | color | `rgba(139,0,0...)` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 18 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 23 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 66 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 74 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 91 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 107 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 40 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 52 | color | `#666` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 53 | color | `#666` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 69 | color | `#666` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 70 | color | `#666` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 88 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 89 | color | `#8B0000` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 90 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 91 | color | `#ef4444` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 105 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 105 | color | `rgba(114,47,55...)` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 105 | color | `rgba(139,0,0...)` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 106 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 117 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 118 | color | `#e8d44d` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 119 | color | `#f0e68c` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 120 | color | `#ffb6c1` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 155 | color | `#ef4444` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 155 | color | `#f97316` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 155 | color | `#22c55e` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 238 | color | `#22c55e` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 238 | color | `#eab308` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 238 | color | `#f97316` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 238 | color | `#ef4444` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 238 | color | `#7f1d1d` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 241 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 461 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/layout.tsx` | 9 | color | `#722F37` |
| `apps/web/app/apps/proper-wine-pour/layout.tsx` | 18 | color | `#e74c6f` |
| `apps/web/app/apps/proper-wine-pour/page.tsx` | 19 | color | `#e74c6f` |

**Medium severity** (17)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/proper-wine-pour/about/page.tsx` | 28 | color | `text-green-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 28 | color | `bg-green-500/15` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 28 | color | `text-green-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 29 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 29 | color | `text-yellow-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 30 | color | `bg-orange-500/15` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 30 | color | `text-orange-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 31 | color | `bg-red-500/15` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 31 | color | `text-red-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 88 | color | `text-yellow-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 89 | color | `text-green-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 90 | color | `text-green-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 91 | color | `text-red-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 241 | shadow | `shadow-[0_0_8px_rgba(255,255,255,0.8)]` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 318 | color | `text-green-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 722 | color | `text-green-400` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 722 | color | `text-red-400` |

### slang-translator (56 violations)

**High severity** (21)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 26 | color | `#22c55e` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 27 | color | `#eab308` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 28 | color | `#ef4444` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 66 | color | `#22c55e` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 67 | color | `#22c55e` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 68 | color | `#ef4444` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 69 | color | `#ef4444` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 70 | color | `#eab308` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 71 | color | `#eab308` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 72 | color | `#8b5cf6` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 73 | color | `#8b5cf6` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 74 | color | `#06b6d4` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 75 | color | `#ec4899` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 76 | color | `#f97316` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 77 | color | `#06b6d4` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 79 | color | `#6b7280` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 403 | color | `#fbbf24` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 403 | color | `#a78bfa` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 644 | color | `#22c55e` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 644 | color | `#eab308` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 644 | color | `#ef4444` |

**Medium severity** (35)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 54 | color | `bg-violet-500/15` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 54 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 58 | color | `bg-amber-500/15` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 58 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 156 | color | `bg-amber-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 156 | color | `border-amber-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 156 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 157 | color | `bg-violet-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 157 | color | `border-violet-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 157 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 225 | color | `bg-amber-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 225 | color | `border-amber-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 225 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 226 | color | `bg-violet-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 226 | color | `border-violet-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 226 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 411 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 411 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 428 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 428 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 438 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 438 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 453 | color | `text-amber-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 453 | color | `text-violet-300` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 516 | color | `border-violet-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 531 | color | `border-amber-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 653 | color | `bg-green-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 653 | color | `bg-red-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 712 | color | `bg-green-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 712 | color | `bg-red-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 714 | shadow | `shadow-[0_0_8px_var(--accent)]` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 737 | color | `border-green-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 737 | color | `bg-green-500/15` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 739 | color | `border-red-500` |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 739 | color | `bg-red-500/15` |

### sprint-planning (54 violations)

**High severity** (5)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 332 | color | `#4A154B` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 333 | color | `#0052CC` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 334 | color | `#2D8CFF` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 335 | color | `#333` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 336 | color | `#4285F4` |

**Medium severity** (49)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 34 | color | `bg-red-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 35 | color | `bg-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 36 | color | `bg-purple-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 37 | color | `bg-gray-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 38 | color | `bg-blue-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 39 | color | `bg-green-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 65 | color | `bg-red-500/15` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 65 | color | `text-red-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 65 | color | `border-red-500/20` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 66 | color | `bg-amber-500/15` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 66 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 66 | color | `border-amber-500/20` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 67 | color | `bg-green-500/15` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 67 | color | `text-green-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 67 | color | `border-green-500/20` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 93 | color | `bg-red-500/12` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 93 | color | `text-red-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 94 | color | `bg-amber-500/12` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 94 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 123 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 123 | color | `bg-amber-500/8` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 123 | color | `bg-amber-500/18` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 132 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 132 | color | `bg-amber-500/8` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 153 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 227 | color | `bg-green-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 269 | color | `border-amber-500/60` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 277 | color | `text-red-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 280 | color | `text-green-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 289 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 289 | color | `bg-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 326 | color | `bg-amber-500/15` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 326 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 327 | color | `bg-blue-500/15` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 327 | color | `text-blue-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 328 | color | `bg-purple-500/15` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 328 | color | `text-purple-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 348 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 365 | color | `border-amber-500/40` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 403 | color | `text-amber-400` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 464 | color | `bg-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 464 | color | `border-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 465 | color | `border-amber-500/40` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 489 | color | `bg-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 489 | color | `border-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 490 | color | `border-amber-500/40` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 512 | color | `bg-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 512 | color | `border-amber-500` |
| `apps/web/app/apps/sprint-planning/components/sprint-app.tsx` | 513 | color | `border-amber-500/40` |

### roblox-dances (53 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/roblox-dances/layout.tsx` | 9 | color | `#EC4899` |

**Medium severity** (52)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 23 | color | `bg-green-500/15` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 23 | color | `text-green-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 23 | color | `border-green-500/30` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 24 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 24 | color | `text-yellow-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 24 | color | `border-yellow-500/30` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 25 | color | `bg-red-500/15` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 25 | color | `text-red-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 25 | color | `border-red-500/30` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 26 | color | `bg-purple-500/15` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 26 | color | `text-purple-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 26 | color | `border-purple-500/30` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 42 | color | `text-yellow-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 63 | color | `text-yellow-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 83 | color | `bg-pink-400/50` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 133 | color | `text-yellow-300` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 140 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 142 | color | `text-green-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 153 | color | `text-blue-300` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 336 | color | `border-pink-400/50` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 336 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 412 | color | `ring-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 423 | color | `ring-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 445 | color | `border-pink-400/50` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 462 | color | `bg-pink-500/10` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 462 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 568 | color | `bg-pink-500` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 613 | color | `ring-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 626 | color | `ring-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 650 | color | `bg-pink-500` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 650 | color | `bg-pink-600` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 680 | color | `bg-green-500/15` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 680 | color | `text-green-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 681 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 681 | color | `text-yellow-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 698 | color | `bg-pink-500/10` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 698 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 759 | color | `ring-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 765 | color | `bg-pink-500` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 765 | color | `bg-pink-600` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 786 | color | `border-pink-400/50` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 786 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 825 | color | `bg-pink-500/20` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 825 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 828 | color | `bg-pink-500/20` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 828 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 831 | color | `bg-pink-500/20` |
| `apps/web/app/apps/roblox-dances/components/dance-app.tsx` | 831 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/layout.tsx` | 18 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/layout.tsx` | 24 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/layout.tsx` | 30 | color | `text-pink-400` |
| `apps/web/app/apps/roblox-dances/page.tsx` | 15 | color | `text-pink-400` |

### meeting-summaries (50 violations)

**Medium severity** (50)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 41 | color | `bg-green-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 41 | color | `text-green-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 41 | color | `border-green-500/20` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 42 | color | `bg-red-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 42 | color | `text-red-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 42 | color | `border-red-500/20` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 43 | color | `bg-gray-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 43 | color | `border-gray-500/20` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 69 | color | `border-amber-500/30` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 85 | color | `bg-amber-500/15` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 85 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 89 | color | `bg-blue-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 89 | color | `text-blue-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 94 | color | `bg-red-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 94 | color | `text-red-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 119 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 129 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 147 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 158 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 170 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 177 | color | `bg-purple-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 177 | color | `text-purple-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 201 | color | `bg-red-500/15` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 201 | color | `text-red-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 201 | color | `border-red-500/20` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 202 | color | `bg-amber-500/15` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 202 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 202 | color | `border-amber-500/20` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 203 | color | `bg-green-500/15` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 203 | color | `text-green-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 203 | color | `border-green-500/20` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 244 | color | `bg-amber-500/12` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 244 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 266 | color | `bg-amber-500/15` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 266 | color | `text-amber-400` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 275 | color | `border-amber-500/40` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 275 | color | `bg-amber-500/8` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 282 | color | `border-green-500/40` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 282 | color | `bg-green-500/8` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 400 | color | `border-amber-500/60` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 414 | color | `bg-amber-500` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 414 | color | `border-amber-500` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 415 | color | `border-amber-500/40` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 444 | color | `border-amber-500/60` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 455 | color | `bg-amber-500` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 455 | color | `border-amber-500` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 456 | color | `border-amber-500/40` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 472 | color | `bg-amber-500` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 472 | color | `border-amber-500` |
| `apps/web/app/apps/meeting-summaries/components/meetings-app.tsx` | 473 | color | `border-amber-500/40` |

### summaries (50 violations)

**Medium severity** (50)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 82 | color | `bg-blue-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 82 | color | `text-blue-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 82 | color | `border-blue-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 83 | color | `bg-purple-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 83 | color | `text-purple-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 83 | color | `border-purple-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 84 | color | `bg-cyan-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 84 | color | `text-cyan-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 84 | color | `border-cyan-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 88 | color | `bg-green-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 88 | color | `text-green-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 88 | color | `border-green-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 89 | color | `bg-gray-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 89 | color | `border-gray-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 90 | color | `bg-red-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 90 | color | `text-red-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 90 | color | `border-red-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 94 | color | `bg-red-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 94 | color | `text-red-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 94 | color | `border-red-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 95 | color | `bg-amber-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 95 | color | `text-amber-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 95 | color | `border-amber-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 96 | color | `bg-blue-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 96 | color | `text-blue-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 96 | color | `border-blue-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 97 | color | `bg-gray-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 97 | color | `border-gray-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 98 | color | `bg-gray-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 98 | color | `border-gray-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 102 | color | `bg-green-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 102 | color | `text-green-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 102 | color | `border-green-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 103 | color | `bg-blue-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 103 | color | `text-blue-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 103 | color | `border-blue-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 104 | color | `bg-amber-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 104 | color | `text-amber-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 104 | color | `border-amber-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 105 | color | `bg-gray-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 105 | color | `border-gray-500/20` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 133 | color | `border-sky-500/30` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 201 | color | `text-sky-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 210 | color | `text-sky-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 224 | color | `text-sky-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 241 | color | `text-sky-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 262 | color | `text-sky-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 269 | color | `bg-purple-500/12` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 269 | color | `text-purple-400` |
| `apps/web/app/apps/summaries/components/summaries-app.tsx` | 322 | color | `border-sky-500/60` |

### accounts (49 violations)

**Medium severity** (49)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 42 | color | `text-sky-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 42 | color | `text-sky-300` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 62 | color | `bg-green-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 62 | color | `text-green-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 62 | color | `border-green-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 63 | color | `bg-amber-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 63 | color | `text-amber-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 63 | color | `border-amber-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 64 | color | `bg-red-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 64 | color | `text-red-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 64 | color | `border-red-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 65 | color | `bg-purple-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 65 | color | `text-purple-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 65 | color | `border-purple-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 66 | color | `bg-blue-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 66 | color | `text-blue-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 66 | color | `border-blue-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 67 | color | `bg-gray-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 67 | color | `border-gray-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 68 | color | `bg-cyan-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 68 | color | `text-cyan-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 68 | color | `border-cyan-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 143 | color | `border-teal-500/40` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 153 | color | `border-teal-500/40` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 163 | color | `border-teal-500/40` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 174 | color | `border-teal-500/40` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 187 | color | `text-green-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 203 | color | `text-amber-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 303 | color | `border-teal-500/30` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 303 | color | `bg-teal-500/5` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 317 | color | `text-sky-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 317 | color | `text-sky-300` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 327 | color | `text-sky-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 327 | color | `text-sky-300` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 347 | color | `text-amber-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 364 | color | `border-teal-500/40` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 392 | color | `text-sky-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 443 | color | `text-purple-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 455 | color | `text-blue-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 478 | color | `text-teal-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 529 | color | `bg-amber-500/8` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 529 | color | `border-amber-500/20` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 530 | color | `text-amber-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 531 | color | `text-amber-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 544 | color | `text-amber-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 706 | color | `border-teal-500/60` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 715 | color | `bg-teal-500/12` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 715 | color | `text-teal-400` |
| `apps/web/app/apps/accounts/components/accounts-app.tsx` | 715 | color | `border-teal-500/20` |

### hspt-practice (45 violations)

**High severity** (12)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 586 | color | `#f59e0b` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 587 | color | `#3b82f6` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 588 | color | `#10b981` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 589 | color | `#ef4444` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 590 | color | `#a855f7` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 648 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 651 | color | `#888` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 656 | color | `#888` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 662 | color | `rgba(0,0,0...)` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 663 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 670 | color | `#aaa` |
| `apps/web/app/apps/hspt-practice/layout.tsx` | 10 | color | `#4F46E5` |

**Medium severity** (33)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 178 | color | `text-green-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 180 | color | `text-amber-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 181 | color | `text-red-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 246 | color | `text-red-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 255 | color | `bg-indigo-500` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 297 | color | `border-indigo-500` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 297 | color | `bg-indigo-500/15` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 319 | color | `border-red-500/50` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 319 | color | `text-red-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 319 | color | `bg-red-500/10` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 343 | color | `ring-indigo-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 343 | color | `border-indigo-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 345 | color | `bg-indigo-500` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 345 | color | `border-indigo-500` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 399 | color | `text-green-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 399 | color | `border-green-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 401 | color | `text-amber-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 401 | color | `border-amber-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 402 | color | `text-red-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 402 | color | `border-red-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 545 | color | `border-green-500` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 545 | color | `bg-green-500/15` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 548 | color | `border-red-500` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 548 | color | `bg-red-500/15` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 730 | color | `text-green-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 732 | color | `text-amber-400` |
| `apps/web/app/apps/hspt-practice/components/practice-app.tsx` | 733 | color | `text-red-400` |
| `apps/web/app/apps/hspt-practice/lib/sections.ts` | 10 | color | `text-amber-400` |
| `apps/web/app/apps/hspt-practice/lib/sections.ts` | 18 | color | `text-blue-400` |
| `apps/web/app/apps/hspt-practice/lib/sections.ts` | 26 | color | `text-green-400` |
| `apps/web/app/apps/hspt-practice/lib/sections.ts` | 44 | color | `text-red-400` |
| `apps/web/app/apps/hspt-practice/lib/sections.ts` | 59 | color | `text-purple-400` |
| `apps/web/app/apps/hspt-practice/page.tsx` | 9 | color | `text-indigo-400` |

### brommie-quake (41 violations)

**High severity** (41)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/brommie-quake/layout.tsx` | 9 | color | `#0067B1` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 84 | color | `#0067B1` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 84 | color | `#CE0F2D` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 84 | color | `#D4A843` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 84 | color | `#003DA5` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 219 | color | `rgba(206,15,45...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 243 | color | `rgba(206,15,45...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 268 | color | `rgba(212, 168, 67...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 278 | color | `rgba(212, 168, 67...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 292 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 293 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 330 | color | `rgba(206, 15, 45...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 344 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 345 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 396 | color | `rgba(212, 168, 67...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 410 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 420 | color | `#8B0000` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 420 | color | `rgba(206, 15, 45...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 420 | color | `rgba(206, 15, 45...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 436 | color | `rgba(255,100,50...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 455 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 482 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 493 | color | `#001428` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 507 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 556 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 571 | color | `#001428` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 571 | color | `#002952` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 577 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 578 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 596 | color | `#0a0a0a` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 603 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 604 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 620 | color | `rgba(212, 168, 67...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 626 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 633 | color | `#0a0a0a` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 633 | color | `#001428` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 652 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 653 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 678 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 718 | color | `rgba(0, 103, 177...)` |
| `apps/web/app/apps/brommie-quake/page.tsx` | 721 | color | `rgba(255,255,255...)` |

### dad-joke-of-the-day (35 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/dad-joke-of-the-day/layout.tsx` | 10 | color | `#f59e0b` |

**Medium severity** (34)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 11 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 18 | color | `text-violet-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 25 | color | `text-blue-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 32 | color | `text-green-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 39 | color | `text-pink-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 46 | color | `text-cyan-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 74 | color | `border-amber-400/40` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 74 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 74 | color | `bg-amber-400/10` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 89 | color | `bg-amber-500` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 89 | color | `bg-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 138 | color | `bg-amber-500/20` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 138 | color | `border-amber-400/40` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 138 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 172 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 179 | color | `text-violet-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 186 | color | `text-green-400` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 211 | color | `bg-amber-500` |
| `apps/web/app/apps/dad-joke-of-the-day/about/page.tsx` | 211 | color | `bg-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 151 | color | `border-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 151 | color | `bg-amber-400/10` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 151 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 164 | color | `border-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 164 | color | `bg-amber-400/10` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 164 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 180 | color | `border-amber-400/40` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 180 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 180 | color | `bg-amber-400/10` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 194 | color | `text-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 211 | color | `border-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 229 | color | `bg-amber-500` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 229 | color | `bg-amber-400` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 254 | color | `bg-blue-600` |
| `apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx` | 254 | color | `bg-blue-500` |

### sentiment (30 violations)

**High severity** (20)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#f59e0b` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#3b82f6` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#22c55e` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#ef4444` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#a855f7` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#06b6d4` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 15 | color | `#ec4899` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 43 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 44 | color | `#9ca3af` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 45 | color | `#9ca3af` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 48 | color | `rgba(15, 22, 41...)` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 49 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 50 | radius | `8px` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 53 | color | `#f59e0b` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 77 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 78 | color | `#9ca3af` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 79 | color | `#9ca3af` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 82 | color | `rgba(15, 22, 41...)` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 83 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 84 | radius | `8px` |

**Medium severity** (10)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 4 | color | `bg-green-500/20` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 4 | color | `text-green-400` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 5 | color | `bg-purple-500/20` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 5 | color | `text-purple-400` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 7 | color | `bg-orange-500/20` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 7 | color | `text-orange-400` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 8 | color | `bg-red-500/20` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 8 | color | `text-red-400` |
| `apps/web/app/apps/sentiment/components/timeline.tsx` | 41 | color | `text-green-400` |
| `apps/web/app/apps/sentiment/components/timeline.tsx` | 46 | color | `text-red-400` |

### generations (24 violations)

**High severity** (13)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/generations/components/slang-dictionary.tsx` | 8 | color | `#22c55e` |
| `apps/web/app/apps/generations/components/slang-dictionary.tsx` | 9 | color | `#06b6d4` |
| `apps/web/app/apps/generations/components/slang-dictionary.tsx` | 10 | color | `#eab308` |
| `apps/web/app/apps/generations/components/slang-dictionary.tsx` | 11 | color | `#ef4444` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 133 | color | `#22c55e` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 133 | color | `#eab308` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 133 | color | `#ef4444` |
| `apps/web/app/apps/generations/lib/generations.ts` | 8 | color | `#8b5cf6` |
| `apps/web/app/apps/generations/lib/generations.ts` | 16 | color | `#06b6d4` |
| `apps/web/app/apps/generations/lib/generations.ts` | 24 | color | `#FF6B9D` |
| `apps/web/app/apps/generations/lib/generations.ts` | 32 | color | `#f59e0b` |
| `apps/web/app/apps/generations/lib/generations.ts` | 40 | color | `#22c55e` |
| `apps/web/app/apps/generations/lib/generations.ts` | 48 | color | `#d4a843` |

**Medium severity** (11)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 111 | color | `bg-green-500` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 111 | color | `bg-red-500` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 159 | color | `bg-green-500` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 159 | color | `bg-red-500` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 161 | shadow | `shadow-[0_0_8px_var(--accent)]` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 189 | color | `border-green-500` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 189 | color | `bg-green-500/10` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 189 | color | `text-green-400` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 191 | color | `border-red-500` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 191 | color | `bg-red-500/10` |
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 191 | color | `text-red-400` |

### daily-updates (23 violations)

**High severity** (12)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 12 | color | `#f59e0b` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 13 | color | `#a855f7` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 14 | color | `#3b82f6` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 15 | color | `#06b6d4` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 16 | color | `#10b981` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 17 | color | `#ef4444` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 18 | color | `#6366f1` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 19 | color | `#ec4899` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 20 | color | `#14b8a6` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 21 | color | `#8b5cf6` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 22 | color | `#f97316` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 26 | color | `#f59e0b` |

**Medium severity** (11)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/daily-updates/about/page.tsx` | 5 | color | `text-amber-400` |
| `apps/web/app/apps/daily-updates/about/page.tsx` | 103 | color | `bg-amber-500` |
| `apps/web/app/apps/daily-updates/about/page.tsx` | 103 | color | `bg-amber-400` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 169 | color | `border-amber-500/40` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 169 | color | `bg-amber-500/10` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 170 | color | `border-amber-500/30` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 293 | color | `border-amber-500/60` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 303 | color | `border-amber-500/60` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 321 | color | `border-amber-500/60` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 341 | color | `bg-amber-500` |
| `apps/web/app/apps/daily-updates/components/feed-app.tsx` | 373 | color | `border-amber-500/40` |

### superstars (23 violations)

**High severity** (23)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/superstars/components/person-card.tsx` | 16 | color | `#00543C` |
| `apps/web/app/apps/superstars/components/person-card.tsx` | 17 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 133 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 161 | color | `#00543C` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 162 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 235 | color | `#0a0e1a` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 247 | shadow | `0 0 60px ${accent}40, 0 0 120px ${primary}50` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 396 | color | `#0a0e1a` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 551 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 603 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 613 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 623 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/layout.tsx` | 12 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/layout.tsx` | 19 | color | `#0a0e1a` |
| `apps/web/app/apps/superstars/layout.tsx` | 21 | color | `rgba(10,14,26...)` |
| `apps/web/app/apps/superstars/layout.tsx` | 25 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/layout.tsx` | 37 | color | `#00543C` |
| `apps/web/app/apps/superstars/layout.tsx` | 37 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/layout.tsx` | 37 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/layout.tsx` | 47 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/page.tsx` | 24 | color | `#00543C` |
| `apps/web/app/apps/superstars/page.tsx` | 24 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/page.tsx` | 24 | color | `#FDBB30` |

### age-of-apes (18 violations)

**High severity** (8)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/age-of-apes/layout.tsx` | 12 | color | `#F59E0B` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 22 | color | `#F59E0B` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 29 | color | `#8B5CF6` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 36 | color | `#3B82F6` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 43 | color | `#10B981` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 50 | color | `#EC4899` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 57 | color | `#06B6D4` |
| `apps/web/app/apps/age-of-apes/lib/calculators.ts` | 64 | color | `#F97316` |

**Medium severity** (10)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/age-of-apes/components/calculator-app.tsx` | 106 | color | `accent-amber-500` |
| `apps/web/app/apps/age-of-apes/components/calculator-app.tsx` | 134 | color | `border-amber-500/40` |
| `apps/web/app/apps/age-of-apes/components/calculator-app.tsx` | 134 | color | `bg-amber-500/10` |
| `apps/web/app/apps/age-of-apes/layout.tsx` | 24 | color | `text-amber-500` |
| `apps/web/app/apps/age-of-apes/layout.tsx` | 45 | color | `text-amber-500` |
| `apps/web/app/apps/age-of-apes/page.tsx` | 15 | color | `text-amber-500` |
| `apps/web/app/apps/age-of-apes/page.tsx` | 47 | color | `text-amber-500` |
| `apps/web/app/apps/age-of-apes/page.tsx` | 89 | color | `bg-amber-500/20` |
| `apps/web/app/apps/age-of-apes/page.tsx` | 89 | color | `border-amber-500/40` |
| `apps/web/app/apps/age-of-apes/page.tsx` | 89 | color | `text-amber-500` |

### uptime (18 violations)

**Medium severity** (18)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/uptime/page.tsx` | 31 | color | `bg-emerald-500/15` |
| `apps/web/app/apps/uptime/page.tsx` | 31 | color | `text-emerald-400` |
| `apps/web/app/apps/uptime/page.tsx` | 31 | color | `border-emerald-500/30` |
| `apps/web/app/apps/uptime/page.tsx` | 35 | color | `bg-red-500/15` |
| `apps/web/app/apps/uptime/page.tsx` | 35 | color | `text-red-400` |
| `apps/web/app/apps/uptime/page.tsx` | 35 | color | `border-red-500/30` |
| `apps/web/app/apps/uptime/page.tsx` | 39 | color | `bg-yellow-500/15` |
| `apps/web/app/apps/uptime/page.tsx` | 39 | color | `text-yellow-400` |
| `apps/web/app/apps/uptime/page.tsx` | 39 | color | `border-yellow-500/30` |
| `apps/web/app/apps/uptime/page.tsx` | 58 | color | `bg-emerald-500` |
| `apps/web/app/apps/uptime/page.tsx` | 60 | color | `bg-red-500` |
| `apps/web/app/apps/uptime/page.tsx` | 61 | color | `bg-yellow-500` |
| `apps/web/app/apps/uptime/page.tsx` | 102 | color | `bg-emerald-500/15` |
| `apps/web/app/apps/uptime/page.tsx` | 102 | color | `text-emerald-400` |
| `apps/web/app/apps/uptime/page.tsx` | 102 | color | `border-emerald-500/30` |
| `apps/web/app/apps/uptime/page.tsx` | 106 | color | `bg-red-500/15` |
| `apps/web/app/apps/uptime/page.tsx` | 106 | color | `text-red-400` |
| `apps/web/app/apps/uptime/page.tsx` | 106 | color | `border-red-500/30` |

### alpha-wins (16 violations)

**High severity** (2)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 145 | color | `rgba(0,0,0...)` |
| `apps/web/app/apps/alpha-wins/layout.tsx` | 9 | color | `#f59e0b` |

**Medium severity** (14)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 145 | shadow | `shadow-[0_8px_32px_rgba(0,0,0,0.3)]` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 145 | radius | `rounded-[var(--radius-glass)]` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 170 | color | `bg-amber-500/15` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 170 | color | `text-amber-400` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 178 | color | `bg-blue-500/15` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 178 | color | `text-blue-400` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 214 | color | `bg-amber-500/15` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 214 | color | `text-amber-400` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 222 | color | `bg-blue-500/15` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 222 | color | `text-blue-400` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 274 | color | `border-amber-500/30` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 274 | color | `text-amber-400` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 290 | color | `border-blue-500/30` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 290 | color | `text-blue-400` |

### standup (12 violations)

**Medium severity** (12)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/standup/components/standup-app.tsx` | 12 | color | `bg-purple-500/15` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 12 | color | `text-purple-400` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 12 | color | `border-purple-500/30` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 17 | color | `bg-slate-500/15` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 17 | color | `text-slate-300` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 17 | color | `border-slate-500/30` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 22 | color | `bg-blue-500/15` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 22 | color | `text-blue-400` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 22 | color | `border-blue-500/30` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 27 | color | `bg-sky-500/15` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 27 | color | `text-sky-400` |
| `apps/web/app/apps/standup/components/standup-app.tsx` | 27 | color | `border-sky-500/30` |

### travel-collection (9 violations)

**High severity** (2)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 171 | color | `oklch(0%_0_0/0.4)` |
| `apps/web/app/apps/travel-collection/layout.tsx` | 11 | color | `#14B8A6` |

**Medium severity** (7)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 171 | shadow | `shadow-[0_8px_32px_oklch(0%_0_0/0.4)]` |
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 204 | color | `bg-green-500/20` |
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 204 | color | `text-green-400` |
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 204 | color | `border-green-500/30` |
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 271 | color | `bg-green-500/20` |
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 271 | color | `text-green-400` |
| `apps/web/app/apps/travel-collection/components/travel-app.tsx` | 271 | color | `border-green-500/30` |

### area-52 (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/area-52/layout.tsx` | 9 | color | `#22c55e` |

### lighthouse (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/lighthouse/layout.tsx` | 10 | color | `#f97316` |

