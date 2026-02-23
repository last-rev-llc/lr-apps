# cc-search — DEC Spec

## Tag: `<cc-search>`

## Purpose
Drop-in search input that survives parent innerHTML rebuilds. Auto-restores focus and cursor position after re-renders.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `placeholder` | string | — | `"Search…"` | Placeholder text |
| `value` | string | — | `""` | Current search value |
| `input-class` | string | — | `"search"` | CSS class on the inner input |
| `input-style` | string | — | `""` | Extra inline styles on the inner input |

## Events
- `cc-search` — `detail: { value }` — fired on input. Bubbles.

## Correct Usage
```html
<cc-search placeholder="Search recipes…" value=""></cc-search>
```
```js
document.querySelector('cc-search').addEventListener('cc-search', e => {
  filterItems(e.detail.value);
});
```

## Common Mistakes (Error Corrections)

- ❌ **Using raw `<input class="search">` instead** — `<cc-search>` handles focus restoration on re-render. Raw inputs lose focus.
- ❌ **Listening for `input` event instead of `cc-search`** — use the component's custom event.
- ❌ **Re-creating the search element on every render** — the component survives innerHTML rebuilds. Keep it in a stable container.
- ❌ **Setting `value` attribute while user is typing** — the component skips external value updates when focused.
