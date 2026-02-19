# Shared Component Library

**URL:** https://shared.adam-harris.alphaclaw.app (living style guide)

## Architecture
All apps load shared resources from this app's public URL:
- `theme.css` — Colors, typography, layout, glass effects, entity CSS (~250+ classes)
- `components/index.js` — Barrel file loading all web components
- `supabase-client.js` — Lightweight REST client for Supabase

## Theme: Glass & Depth
- Amber/gold accent (#f59e0b), glassmorphism cards (backdrop-filter: blur)
- Serif headings (Georgia), deep navy gradient background (#0a0e1a → #1a1b3a)
- CSS vars: --glass, --glass-hover, --glass-border, --accent-grad, --serif, --shadow

## Web Components (28+)
**Layout:** cc-topbar, cc-nav, cc-sidebar, cc-auth, cc-toast, cc-modal, cc-tabs, cc-app-nav
**Data:** cc-field, cc-prefs, cc-helpers
**UI:** cc-icons (19 brand SVGs), cc-pill-filter, cc-pill-dropdown, cc-user-pill
**Animation:** cc-fade-in, cc-slide-in, cc-stagger, cc-typewriter, cc-reveal, cc-parallax, cc-stat-counter, cc-confetti, cc-particles, cc-lightbox, cc-empty-state

## Key Rules
1. Components are fully independent — never reach into DOM to find/wrap siblings
2. All styling via CSS classes in theme.css, never inline styles
3. Sticky header: wrap cc-topbar + cc-nav in `<div class="sticky-header">`
4. cc-app-nav supports `position="bottom"` for landing pages
