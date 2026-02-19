# cc-dev-toolbar — DEC Spec

## Tag: `<cc-dev-toolbar>`

## Purpose
Floating developer toolbar (bottom-left) with Edit Mode toggle and Console Logs viewer. Polls Supabase `app_console_logs` for error counts.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `app` | string | ✅ | hostname prefix | App slug for filtering console logs |

## No Manual Placement Needed
`<cc-app-nav>` automatically renders `<cc-dev-toolbar app="...">`. Don't add it separately.

## Common Mistakes (Error Corrections)

- ❌ **Placing `<cc-dev-toolbar>` manually** — `<cc-app-nav>` handles it. Adding it manually creates duplicates.
- ❌ **Missing `app` attribute** — falls back to hostname, which may be wrong in shared domains.
- ❌ **Building custom error/debug panels** — use the dev toolbar's built-in console log viewer.
