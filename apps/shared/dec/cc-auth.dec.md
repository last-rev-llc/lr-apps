# cc-auth — DEC Spec

## Tag: `<cc-auth>`

## Purpose
Password gate overlay. Hides the page until correct password is entered. Stores auth in localStorage.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `password` | string | — | `"lr2026"` | The password to unlock |
| `storage-key` | string | — | `"cc_auth"` | localStorage key for persisting auth |

## Slots / Children
- None — self-contained overlay.

## Correct Usage
```html
<!-- Standard — use defaults -->
<cc-auth></cc-auth>

<!-- Custom password -->
<cc-auth password="mySecret123"></cc-auth>
```

## Common Mistakes (Error Corrections)

- ❌ **Omitting `<cc-auth>` entirely** — all app pages must be gated.
- ❌ **Placing it after heavy DOM content** — put it near the top of `<body>` so the gate appears before content renders.
- ❌ **Adding custom lock/unlock UI** — `<cc-auth>` handles the full lock screen. Don't build your own.
- ❌ **Using it with `<cc-topbar>`'s old lock icon** — `<cc-auth>` is standalone now. No nav integration needed.
- ❌ **Multiple `<cc-auth>` elements** — only one per page.
