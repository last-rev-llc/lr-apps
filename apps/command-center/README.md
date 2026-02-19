# Command Center

**URL:** https://command-center.adam-harris.alphaclaw.app (pw: lastrev2026)

## Architecture
- Static HTML, no build step. Plain HTML + shared CSS + web components.
- Dashboard at `index.html` with gridstack.js for draggable/resizable 12-column module grid.
- Layout persists to localStorage (`cc-dashboard-layout`). Reset button in header.
- My Apps row stays fixed above the grid (not draggable). Currently 27 apps.
- All pages use shared theme from `shared.adam-harris.alphaclaw.app`.

## Component Stack
```
<div class="sticky-header">
  <cc-topbar>  — Dashboard link + Lock/Logout
  <cc-nav>     — App navigation links
</div>
<cc-auth>      — Pure auth gate (password: lastrev2026)
<cc-toast>     — Toast notification queue
```

## Key Pages
- `index.html` — Dashboard with module grid
- `ideas.html` — 152+ ideas with pill-dropdown filters, snooze, scoring
- `recipes.html` — 53 recipes
- `crons.html` — Full cron management
- `backlog-meeting.html` — Client-grouped backlog prep with Supabase archives
- `higgsfield.html` — 60+ Higgsfield AI prompts

## Data Sources
- Primary: Supabase (lregiwsovpmljxjvrrsc.supabase.co) — 22+ tables
- Fallback: JSON files in `data/` directory
- Pattern: `<meta name="supabase-url/key">` tags + `window.supabase` singleton

## Dashboard Modules
Modules are custom web components (`cc-*`) in `modules/` directory. Each is self-contained with data fetching. Empty states use `<cc-empty-state>` with contained sparkle animations.

## Shared Components Used
All from `shared.adam-harris.alphaclaw.app/components/index.js`:
cc-topbar, cc-nav, cc-auth, cc-toast, cc-helpers, cc-sidebar, cc-modal, cc-field, cc-prefs, cc-tabs, cc-icons, cc-pill-filter, cc-pill-dropdown, cc-user-pill

## CRM (cc-users module)
- Team modal with 6 tabs: Overview, Insights, Social, Slack, GitHub, Email
- Profile completeness scoring (12 checks, color-coded border)
- Research buttons trigger people-research + personality-insights skills
- Brand icons via cc-icons (19 SVGs from Simple Icons)
- PDF export for team directory profiles
