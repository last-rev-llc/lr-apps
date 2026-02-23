# cc-app-nav — DEC Spec

## Tag: `<cc-app-nav>`

## Purpose
Top navigation bar for standalone apps. Renders streamlined nav: Logo/Title | Landing | Admin | GitHub dropdown. Automatically includes `<cc-dev-toolbar>`.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `app` | string | ✅ | `""` | App slug — used for GitHub link (`last-rev-llc/ah-{app}`) and dev toolbar |
| `title` | string | ✅ | value of `app` | Display title with optional emoji (e.g. `"💡 Ideas"`) |
| `active` | string | — | auto-detect | Current page: `"home"` \| `"landing"` \| `"admin"` |
| `base` | string | — | `location.origin` | Base URL override for link generation |
| `repo` | string | — | `last-rev-llc/ah-{app}` | GitHub repo override |
| `position` | string | — | `"top"` | `"top"` or `"bottom"` — landing pages use `"bottom"` |
| `pages` | JSON string | — | `[]` | Extra nav links: `[{"id":"x","label":"X","href":"x.html","lucide":"icon"}]` |

## Slots / Children
- None — self-contained. Renders its own nav + `<cc-dev-toolbar>`.

## Correct Usage
```html
<!-- Standard app page -->
<cc-app-nav app="recipes" title="🍳 Recipes" active="home"></cc-app-nav>

<!-- Landing page (bottom position) -->
<cc-app-nav app="recipes" title="🍳 Recipes" active="landing" position="bottom"></cc-app-nav>

<!-- Admin page -->
<cc-app-nav app="recipes" title="🍳 Recipes" active="admin"></cc-app-nav>
```

## Common Mistakes (Error Corrections)

- ❌ **Using `<cc-topbar>` or `<cc-nav>` in standalone apps** — those are command-center only. Use `<cc-app-nav>` exclusively.
- ❌ **Missing `app` attribute** — breaks GitHub link generation and dev toolbar. Always provide it.
- ❌ **Missing `title` attribute** — falls back to empty string; always set it with emoji prefix.
- ❌ **Forgetting `active` attribute** — auto-detection works but explicit is better for clarity.
- ❌ **Adding custom nav links manually** — use the `pages` attribute JSON if extra links are needed.
- ❌ **Placing `<cc-dev-toolbar>` separately** — `<cc-app-nav>` auto-renders it. Don't duplicate.
- ❌ **Not using `position="bottom"` on landing pages** — landing pages must use bottom nav.
- ❌ **Hardcoding GitHub URLs** — let `repo` attribute generate them automatically.

## Nav Structure (Streamlined — as of commit 78e5d4d)
```
Logo/Title | Landing | Admin | GitHub (dropdown: Repo, PRs, Issues, Actions)
```
Do NOT add Ideas, Prompts, Ads, etc. as top-level nav items. Those live inside admin.html tabs.
