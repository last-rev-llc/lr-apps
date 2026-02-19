# cc-sidebar — DEC Spec

## Tag: `<cc-sidebar>`

## Purpose
Vertical sidebar navigation with mobile hamburger/overlay support. Used for apps with list-detail layouts.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | — | `""` | Sidebar header title |
| `subtitle` | string | — | `""` | Sidebar header subtitle |

## JS API
```js
const sb = document.querySelector('cc-sidebar');
sb.setSidebarItems([
  { id: 'home', icon: '🏠', name: 'Home', description: 'Main view' },
  { id: 'settings', icon: '⚙️', name: 'Settings' }
]);
sb.setActive('home');
sb.onselect = (id) => { /* handle selection */ };
sb.open();   // mobile: show overlay
sb.close();  // mobile: hide overlay
sb.toggle();
```

## Events
- Selection is handled via the `onselect` callback (not a CustomEvent).

## Slots / Children
- None — items are set programmatically via `setSidebarItems()`.

## Correct Usage
```html
<cc-sidebar title="📚 Library" subtitle="Browse items"></cc-sidebar>
```
```js
const sidebar = document.querySelector('cc-sidebar');
sidebar.setSidebarItems(items);
sidebar.onselect = (id) => loadItem(id);
```

## Common Mistakes (Error Corrections)

- ❌ **Passing items as HTML children** — items must be set via `setSidebarItems()`, not as DOM children.
- ❌ **Using `addEventListener('select')`** — use the `onselect` callback property instead.
- ❌ **Building custom sidebar navigation** — always use `<cc-sidebar>` for list-detail layouts.
- ❌ **Forgetting to call `setActive()`** — sidebar won't highlight the current item without it.
- ❌ **Empty sidebar without `<cc-empty-state>`** — the component auto-renders empty state when items array is empty.
