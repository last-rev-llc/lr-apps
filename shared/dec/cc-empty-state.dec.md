# cc-empty-state — DEC Spec

## Tag: `<cc-empty-state>`

## Purpose
Celebratory empty state with sparkle or confetti animation. **MANDATORY for all empty states** — never use plain text or hide sections when there's no data.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `message` | string | — | `"All clear!"` | Message to display |
| `icon` | string | — | `"✨"` | Emoji or icon |
| `animation` | string | — | `"sparkle"` | `"sparkle"` \| `"confetti"` \| `"none"` |

## Correct Usage
```html
<cc-empty-state message="No recipes yet — time to cook!" icon="🍳"></cc-empty-state>
<cc-empty-state message="All tasks complete!" icon="🎉" animation="confetti"></cc-empty-state>
<cc-empty-state message="No results found" icon="🔍" animation="none"></cc-empty-state>
```

## Common Mistakes (Error Corrections)

- ❌ **Showing plain "No data" text** — always use `<cc-empty-state>`. This is mandatory.
- ❌ **Hiding the section entirely when empty** — show the empty state instead.
- ❌ **Using `<cc-empty-state>` for loading states** — it's for empty data, not loading spinners.
- ❌ **Generic messages** — customize `message` and `icon` to the context (e.g., "No recipes" not "Nothing here").
