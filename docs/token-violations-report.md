# Token Usage Violations Report

> Generated: 2026-04-29
> Scanned: `apps/web/app/apps/` (28 apps)
> Total violations: **380**

## Summary

| Severity | Count |
|----------|-------|
| High (inline hex/rgb/oklch) | 53 |
| Medium (Tailwind hardcoded colors) | 327 |
| Low | 0 |

| Violation Type | Count |
|----------------|-------|
| Color | 369 |
| Shadow | 8 |
| Border Radius | 3 |
| Font Family | 0 |

## Per-App Summary

| App | Total | Color | Shadow | Radius | Font | High | Medium | Low |
|-----|-------|-------|--------|--------|------|------|--------|-----|
| command-center | 250 | 250 | 0 | 0 | 0 | 13 | 237 | 0 |
| ai-calculator | 58 | 58 | 0 | 0 | 0 | 0 | 58 | 0 |
| sales | 16 | 16 | 0 | 0 | 0 | 0 | 16 | 0 |
| lighthouse | 9 | 9 | 0 | 0 | 0 | 8 | 1 | 0 |
| sentiment | 9 | 7 | 0 | 2 | 0 | 2 | 7 | 0 |
| superstars | 7 | 6 | 1 | 0 | 0 | 7 | 0 | 0 |
| cringe-rizzler | 6 | 3 | 3 | 0 | 0 | 6 | 0 | 0 |
| area-52 | 4 | 4 | 0 | 0 | 0 | 1 | 3 | 0 |
| generations | 4 | 3 | 1 | 0 | 0 | 3 | 1 | 0 |
| proper-wine-pour | 4 | 3 | 1 | 0 | 0 | 3 | 1 | 0 |
| alpha-wins | 3 | 1 | 1 | 1 | 0 | 1 | 2 | 0 |
| brommie-quake | 2 | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| age-of-apes | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| dad-joke-of-the-day | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| hspt-practice | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| hspt-tutor | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| roblox-dances | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| slang-translator | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 |
| soccer-training | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| travel-collection | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| accounts | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| client-health | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| daily-updates | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| meeting-summaries | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| sprint-planning | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| standup | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| summaries | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| uptime | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

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

### command-center (250 violations)

**High severity** (13)

| File | Line | Type | Value |
|------|------|------|-------|
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

**Medium severity** (237)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/command-center/page.tsx` | 150 | color | `bg-green-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 150 | color | `text-green-400` |
| `apps/web/app/apps/command-center/page.tsx` | 150 | color | `border-green-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 151 | color | `bg-purple-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 151 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/page.tsx` | 151 | color | `border-purple-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 152 | color | `bg-blue-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 152 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/page.tsx` | 152 | color | `border-blue-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 153 | color | `bg-yellow-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 153 | color | `text-yellow-400` |
| `apps/web/app/apps/command-center/page.tsx` | 153 | color | `border-yellow-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 154 | color | `bg-red-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 154 | color | `text-red-400` |
| `apps/web/app/apps/command-center/page.tsx` | 154 | color | `border-red-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 155 | color | `bg-cyan-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 155 | color | `text-cyan-400` |
| `apps/web/app/apps/command-center/page.tsx` | 155 | color | `border-cyan-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 156 | color | `bg-orange-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 156 | color | `text-orange-400` |
| `apps/web/app/apps/command-center/page.tsx` | 156 | color | `border-orange-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 157 | color | `bg-pink-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 157 | color | `text-pink-400` |
| `apps/web/app/apps/command-center/page.tsx` | 157 | color | `border-pink-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 158 | color | `bg-indigo-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 158 | color | `text-indigo-400` |
| `apps/web/app/apps/command-center/page.tsx` | 158 | color | `border-indigo-500/20` |
| `apps/web/app/apps/command-center/page.tsx` | 193 | color | `bg-zinc-500/10` |
| `apps/web/app/apps/command-center/page.tsx` | 193 | color | `text-zinc-400` |
| `apps/web/app/apps/command-center/page.tsx` | 193 | color | `border-zinc-500/20` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 103 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 103 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 103 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 148 | color | `text-red-400` |
| `apps/web/app/apps/command-center/agents/components/agents-app.tsx` | 148 | color | `bg-red-500/5` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 78 | color | `border-purple-500/60` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 78 | color | `bg-purple-500/15` |
| `apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx` | 78 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 77 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 77 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/app-access/components/app-access-app.tsx` | 77 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 173 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 173 | color | `bg-purple-500/10` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 202 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/architecture/components/architecture-app.tsx` | 202 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/cc-flags/components/flags-app.tsx` | 125 | color | `text-red-400` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 81 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 81 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 81 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 123 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 123 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 123 | color | `border-amber-500/30` |
| `apps/web/app/apps/command-center/concerts/components/concerts-app.tsx` | 123 | color | `bg-amber-500/10` |
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
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 185 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 185 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 185 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 310 | color | `bg-green-500/25` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 310 | color | `border-green-500/40` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 317 | color | `bg-green-400` |
| `apps/web/app/apps/command-center/crons/components/crons-app.tsx` | 345 | color | `text-green-400/70` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 72 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 130 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 214 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 214 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 230 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 230 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/gallery/components/gallery-app.tsx` | 230 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 358 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 358 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 384 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 384 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 465 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 588 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/ideas/components/ideas-app.tsx` | 707 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 158 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 158 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 158 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 172 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 172 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 172 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 270 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 270 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 279 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 279 | color | `text-blue-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 289 | color | `text-sky-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 289 | color | `text-sky-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 374 | color | `text-blue-400` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 374 | color | `text-blue-300` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 470 | color | `bg-blue-500/10` |
| `apps/web/app/apps/command-center/leads/components/leads-app.tsx` | 470 | color | `text-blue-400` |
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
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 400 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 409 | color | `bg-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 409 | color | `border-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 422 | color | `bg-amber-500` |
| `apps/web/app/apps/command-center/meeting-summaries/components/meetings-app.tsx` | 422 | color | `border-amber-500` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 158 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 168 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 179 | color | `accent-amber-500` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 198 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 198 | color | `bg-amber-500/10` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 198 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 219 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 219 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 219 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/meme-generator/components/meme-generator-app.tsx` | 219 | color | `bg-amber-500/30` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 93 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 212 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 212 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 212 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 224 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 227 | color | `bg-zinc-900` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 239 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/pr-review/components/pr-app.tsx` | 242 | color | `bg-zinc-900` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 207 | color | `text-amber-400/80` |
| `apps/web/app/apps/command-center/recipes/components/recipes-app.tsx` | 227 | color | `text-amber-400/80` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 118 | color | `border-purple-500/60` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 118 | color | `bg-purple-500/15` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 118 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 137 | color | `text-amber-400/80` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 161 | color | `text-purple-400` |
| `apps/web/app/apps/command-center/rizz-guide/components/rizz-guide-app.tsx` | 185 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 121 | color | `bg-green-500/70` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 140 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 148 | color | `border-amber-500/50` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 166 | color | `bg-amber-500/20` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 166 | color | `border-amber-500/40` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 166 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 166 | color | `bg-amber-500/30` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 180 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 180 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 180 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 192 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 192 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 192 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 212 | color | `border-red-500/30` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 212 | color | `bg-red-500/10` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 212 | color | `text-red-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 212 | color | `bg-red-500/20` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 252 | color | `border-green-500` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 252 | color | `bg-green-500/30` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 256 | color | `text-green-400` |
| `apps/web/app/apps/command-center/shopping-list/components/shopping-list-app.tsx` | 272 | color | `text-red-400` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 79 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 79 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 79 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 92 | color | `border-purple-500/60` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 92 | color | `bg-purple-500/15` |
| `apps/web/app/apps/command-center/team-usf/components/team-usf-app.tsx` | 92 | color | `text-purple-400` |
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
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 147 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 165 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 165 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 165 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 190 | color | `border-amber-500/60` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 190 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 190 | color | `text-amber-400` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 247 | color | `border-amber-500/30` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 256 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 256 | color | `text-amber-300` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 306 | color | `text-sky-400` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 337 | color | `border-amber-500/25` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 342 | color | `bg-amber-500/15` |
| `apps/web/app/apps/command-center/users/components/users-app.tsx` | 342 | color | `text-amber-300` |

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

### sales (16 violations)

**Medium severity** (16)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sales/components/leads-app.tsx` | 177 | color | `border-amber-500/60` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 177 | color | `bg-amber-500/15` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 177 | color | `text-amber-400` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 195 | color | `border-amber-500/60` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 195 | color | `bg-amber-500/15` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 195 | color | `text-amber-400` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 349 | color | `text-amber-400` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 349 | color | `text-amber-300` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 358 | color | `text-blue-400` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 358 | color | `text-blue-300` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 368 | color | `text-sky-400` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 368 | color | `text-sky-300` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 458 | color | `text-blue-400` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 458 | color | `text-blue-300` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 560 | color | `bg-blue-500/10` |
| `apps/web/app/apps/sales/components/leads-app.tsx` | 560 | color | `text-blue-400` |

### lighthouse (9 violations)

**High severity** (8)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 12 | color | `#f59e0b` |
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 13 | color | `#3b82f6` |
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 14 | color | `#10b981` |
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 15 | color | `#a855f7` |
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 97 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 104 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/lighthouse/components/score-history.tsx` | 125 | color | `rgba(255,255,255...)` |
| `apps/web/app/apps/lighthouse/layout.tsx` | 10 | color | `#f97316` |

**Medium severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/lighthouse/components/sites-table.tsx` | 51 | color | `bg-amber-500/8` |

### sentiment (9 violations)

**High severity** (2)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 52 | radius | `8px` |
| `apps/web/app/apps/sentiment/components/sentiment-chart.tsx` | 88 | radius | `8px` |

**Medium severity** (7)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/sentiment/__tests__/sentiment-dashboard.test.tsx` | 77 | color | `bg-zinc-500/10` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 6 | color | `bg-zinc-500/10` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 6 | color | `text-zinc-500` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 6 | color | `border-zinc-500/20` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 12 | color | `bg-zinc-500/10` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 12 | color | `text-zinc-500` |
| `apps/web/app/apps/sentiment/components/mood-badge.tsx` | 12 | color | `border-zinc-500/20` |

### superstars (7 violations)

**High severity** (7)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/superstars/__tests__/person-card.test.tsx` | 20 | color | `#00543C` |
| `apps/web/app/apps/superstars/__tests__/person-card.test.tsx` | 21 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/__tests__/person-profile.test.tsx` | 20 | color | `#00543C` |
| `apps/web/app/apps/superstars/__tests__/person-profile.test.tsx` | 20 | color | `#FDBB30` |
| `apps/web/app/apps/superstars/__tests__/person-profile.test.tsx` | 31 | color | `#ff0000` |
| `apps/web/app/apps/superstars/components/person-profile.tsx` | 251 | shadow | `0 0 60px ${accent}40, 0 0 120px ${primary}50` |
| `apps/web/app/apps/superstars/layout.tsx` | 14 | color | `#FDBB30` |

### cringe-rizzler (6 violations)

**High severity** (6)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 115 | shadow | `0 0 24px color-mix(in srgb, var(--color-pill-6) 40%, transpa` |
| `apps/web/app/apps/cringe-rizzler/about/page.tsx` | 243 | shadow | `0 0 24px color-mix(in srgb, var(--color-pill-6) 40%, transpa` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 187 | shadow | `0 0 20px color-mix(in srgb, var(--color-pill-6) 40%, transpa` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 318 | color | `#ffffff` |
| `apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx` | 319 | color | `#000000` |
| `apps/web/app/apps/cringe-rizzler/layout.tsx` | 15 | color | `#ec4899` |

### area-52 (4 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/area-52/layout.tsx` | 10 | color | `#22c55e` |

**Medium severity** (3)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/area-52/components/area-52-app.tsx` | 75 | color | `border-amber-500/60` |
| `apps/web/app/apps/area-52/components/area-52-app.tsx` | 75 | color | `bg-amber-500/15` |
| `apps/web/app/apps/area-52/components/area-52-app.tsx` | 75 | color | `text-amber-400` |

### generations (4 violations)

**High severity** (3)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/generations/__tests__/generation-card.test.tsx` | 24 | color | `#a855f7` |
| `apps/web/app/apps/generations/__tests__/slang-dictionary.test.tsx` | 42 | color | `#a855f7` |
| `apps/web/app/apps/generations/__tests__/slang-quiz.test.tsx` | 27 | color | `#a855f7` |

**Medium severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/generations/components/slang-quiz.tsx` | 161 | shadow | `shadow-[0_0_8px_var(--accent)]` |

### proper-wine-pour (4 violations)

**High severity** (3)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 265 | color | `oklch(from var(--color-red)` |
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 268 | color | `oklch(100%_0_0/0.8)` |
| `apps/web/app/apps/proper-wine-pour/layout.tsx` | 11 | color | `#722F37` |

**Medium severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/proper-wine-pour/components/wine-app.tsx` | 268 | shadow | `shadow-[0_0_8px_oklch(100%_0_0/0.8)]` |

### alpha-wins (3 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/alpha-wins/layout.tsx` | 10 | color | `#f59e0b` |

**Medium severity** (2)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 199 | shadow | `shadow-[var(--shadow-glass-hover)]` |
| `apps/web/app/apps/alpha-wins/components/wins-gallery.tsx` | 199 | radius | `rounded-[var(--radius-glass)]` |

### brommie-quake (2 violations)

**High severity** (2)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/brommie-quake/brommie-quake.css` | 295 | color | `rgba(255,100,50...)` |
| `apps/web/app/apps/brommie-quake/layout.tsx` | 10 | color | `#0067B1` |

### age-of-apes (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/age-of-apes/layout.tsx` | 13 | color | `#F59E0B` |

### dad-joke-of-the-day (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/dad-joke-of-the-day/layout.tsx` | 12 | color | `#f59e0b` |

### hspt-practice (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/hspt-practice/layout.tsx` | 12 | color | `#4F46E5` |

### hspt-tutor (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/hspt-tutor/layout.tsx` | 12 | color | `#10B981` |

### roblox-dances (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/roblox-dances/layout.tsx` | 11 | color | `#EC4899` |

### slang-translator (1 violations)

**Medium severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | 706 | shadow | `shadow-[0_0_8px_var(--accent)]` |

### soccer-training (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/soccer-training/layout.tsx` | 12 | color | `#22c55e` |

### travel-collection (1 violations)

**High severity** (1)

| File | Line | Type | Value |
|------|------|------|-------|
| `apps/web/app/apps/travel-collection/layout.tsx` | 11 | color | `#14B8A6` |

