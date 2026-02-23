# cc-tabs / cc-tab — DEC Spec

## Tags: `<cc-tabs>` + `<cc-tab>`

## Purpose
Tabbed container. Renders tab bar and shows/hides panels. Persists active tab in URL `?tab=` param by default.

## `<cc-tabs>` Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `active` | string | — | first tab | Initially active tab name |
| `no-url` | boolean | — | — | Prevents persisting tab to URL params (use in modals) |

## `<cc-tab>` Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | ✅ | — | Unique tab identifier |
| `label` | string | ✅ | value of `name` | Display text |
| `icon` | string | — | — | Lucide icon name |

## Events
- `tab-change` — `detail: { tab }` — fired on tab switch, bubbles.

## Slots / Children
- `<cc-tabs>` children must be `<cc-tab>` elements. Each `<cc-tab>` wraps its panel content.

## Correct Usage
```html
<cc-tabs active="overview">
  <cc-tab name="overview" label="Overview" icon="layout-dashboard">
    <p>Overview content</p>
  </cc-tab>
  <cc-tab name="settings" label="Settings" icon="settings">
    <p>Settings content</p>
  </cc-tab>
</cc-tabs>
```

```html
<!-- In a modal — prevent URL pollution -->
<cc-modal title="Details">
  <cc-tabs active="info" no-url>
    <cc-tab name="info" label="Info">...</cc-tab>
    <cc-tab name="raw" label="Raw Data">...</cc-tab>
  </cc-tabs>
</cc-modal>
```

## Common Mistakes (Error Corrections)

- ❌ **Building custom tab UI from scratch** — always use `<cc-tabs>`. Never create manual tab buttons.
- ❌ **Forgetting `no-url` inside modals** — tabs in modals/dialogs pollute the URL. Always add `no-url`.
- ❌ **Putting non-`<cc-tab>` children inside `<cc-tabs>`** — only `<cc-tab>` elements are recognized.
- ❌ **Duplicate `name` attributes** — each tab name must be unique within its `<cc-tabs>`.
- ❌ **Missing `label` on `<cc-tab>`** — falls back to `name` which is usually not user-friendly.
- ❌ **Not listening to `tab-change`** — if you need to react to tab switches (e.g., lazy load), listen for this event.
- ❌ **admin.html not using `<cc-tabs>`** — the admin page MUST use tabs for Ideas, Prompts, Ads, Docs.
