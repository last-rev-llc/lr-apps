# cc-edit-mode — DEC Spec

## Tag: `<cc-edit-mode>` (auto-initialized, no tag needed)

## Purpose
Edit Mode overlay system. Scans DOM for `cc-*` / `lr-*` components, shows wand overlay on hover, lets users submit feedback to Supabase `trigger_queue`. Activated via `<cc-dev-toolbar>`.

## No Manual Usage Needed
This component is automatically loaded by `components/index.js` and controlled by `<cc-dev-toolbar>` (which is auto-rendered by `<cc-app-nav>`).

## JS API (internal)
```js
window.__ccEditMode.toggle();
window.__ccEditMode.activate();
window.__ccEditMode.deactivate();
```

## Common Mistakes (Error Corrections)

- ❌ **Manually placing `<cc-edit-mode>` in HTML** — it's auto-initialized. Don't add it.
- ❌ **Manually placing `<cc-dev-toolbar>` in HTML** — `<cc-app-nav>` renders it automatically.
- ❌ **Building custom feedback/edit UIs** — use Edit Mode for component-level feedback.
