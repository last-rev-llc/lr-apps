# cc-pill-filter — DEC Spec

## Tag: `<cc-pill-filter>`

## Purpose
Labeled row of pill filter buttons. Shows ALL options as a horizontal row. For single-select filters, **prefer `<cc-pill-dropdown>` instead**.

## ⚠️ IMPORTANT RULE
> Use `<cc-pill-dropdown>` for single-choice filters (category, status, sort). `<cc-pill-filter>` only for multi-select or ≤3 options that must all be visible (e.g., view mode toggle).

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `label` | string | — | `""` | Row label |
| `items` | JSON string | ✅ | `[]` | `["All","Active"]` or `[{"value":"all","label":"All","count":10}]` |
| `value` | string | — | `""` | Currently active value |
| `counts` | JSON string | — | `{}` | `{"all": 10, "active": 5}` — badge counts |
| `colored` | boolean | — | — | Hash-based colors from shared palette |

## Events
- `pill-change` — `detail: { value }` — fired on selection.

## JS API
```js
CcPillFilter.colorFor('Technical'); // returns hash-based color string
```

## Correct Usage
```html
<!-- Multi-select or very few options -->
<cc-pill-filter label="View" items='["Grid","List"]' value="Grid"></cc-pill-filter>

<!-- With counts -->
<cc-pill-filter label="Status" items='[{"value":"all","label":"All","count":20},{"value":"open","label":"Open","count":12}]' value="all"></cc-pill-filter>
```

## Common Mistakes (Error Corrections)

- ❌ **Using `<cc-pill-filter>` for 5+ single-select options** — use `<cc-pill-dropdown>` instead. Pills blow out on mobile.
- ❌ **Using it for Sort/Category/Type dropdowns** — always `<cc-pill-dropdown>` for those.
- ❌ **Invalid JSON in `items`** — must be valid JSON array.
- ❌ **Building custom filter buttons** — use the component, don't hand-roll pill UIs.
- ❌ **Forgetting to set initial `value`** — no pill will be highlighted.
