# Roblox Dances

**URL:** https://roblox-dances.adam-harris.alphaclaw.app

Catalog app for Roblox dance move Luau scripts. Left sidebar nav, right-side code viewer with Lua syntax highlighting, line numbers, copy button.

## Data
- `data/dances.json` — Array of `{id, name, emoji, description, createdAt, code}`
- Also in Supabase `dances` table (8 entries)

## Adding Dances
Use the Motor6D Animator skill (`skills/roblox-motor6d-animator/`) to write Luau scripts, then add to dances.json.

## Important
Adam is building a SERVER COMPONENT for imports. Future dance scripts should be clean modules (exportable), NOT standalone scripts with character-finding boilerplate.

## Components
Uses cc-sidebar shared component. App-specific CSS: ~5 lines. Code viewer uses shared `.code-viewer` classes.
