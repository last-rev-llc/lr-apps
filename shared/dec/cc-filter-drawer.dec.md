# cc-filter-drawer — DEC Spec

## Tag: `<cc-filter-drawer>`

## Purpose
Slide-out filter sidebar panel. Renders its own trigger button (filter icon). Uses Shadow DOM with slots.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | — | `"Filters"` | Drawer header text |
| `active` | boolean | — | — | Shows orange dot on trigger button (indicates active filters) |

## JS API
```js
const drawer = document.querySelector('cc-filter-drawer');
drawer.open();
drawer.close();
drawer.toggle();
drawer.isOpen;        // boolean
drawer.active = true; // show active dot
```

## Events
- `cc-filter-drawer-open` — fired on open. Bubbles.
- `cc-filter-drawer-close` — fired on close. Bubbles.

## Slots
- Default slot — filter controls (e.g., `<cc-pill-dropdown>`, `<cc-pill-filter>`, `<cc-search>`).

## Correct Usage
```html
<cc-filter-drawer title="Filters">
  <cc-pill-dropdown label="Category" items='[...]' value="all"></cc-pill-dropdown>
  <cc-pill-dropdown label="Sort" items='[...]' value="date" direction="desc"></cc-pill-dropdown>
</cc-filter-drawer>
```

## Common Mistakes (Error Corrections)

- ❌ **Building custom filter sidebars** — use `<cc-filter-drawer>`.
- ❌ **Adding a separate trigger button** — the component renders its own filter icon button.
- ❌ **Note: uses Shadow DOM** — this is the ONE component that uses Shadow DOM. Styles inside the drawer panel come from its internal stylesheet. Slotted children inherit theme.css from the light DOM.
- ❌ **Forgetting `active` attribute** — set it when any filter is non-default to show the dot indicator.
