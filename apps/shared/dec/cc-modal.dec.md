# cc-modal — DEC Spec

## Tag: `<cc-modal>`

## Purpose
Modal overlay with sticky header, scrollable body, and optional footer. Handles Escape key, backdrop click, and body scroll lock.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | ✅ | `""` | Modal title |
| `size` | string | — | `"md"` | `"sm"` (420px) \| `"md"` (600px) \| `"lg"` (800px) |
| `open` | boolean | — | — | Shows the modal when present |

## JS API
```js
const modal = document.querySelector('cc-modal');
modal.open();
modal.close();
modal.toggle();
```

## Events
- `modal-close` — dispatched on close (Escape, backdrop click, or ✕ button). Bubbles.

## Slots
- **Default** — body content
- `slot="footer"` — footer with action buttons

## Correct Usage
```html
<cc-modal title="Edit Item" size="md">
  <cc-field label="Name" name="name"></cc-field>
  <div slot="footer">
    <button class="btn btn-primary" onclick="this.closest('cc-modal').close()">Save</button>
  </div>
</cc-modal>
```

```js
// Open programmatically
document.querySelector('#my-modal').open();
```

## Common Mistakes (Error Corrections)

- ❌ **Building custom modal/overlay HTML** — always use `<cc-modal>`.
- ❌ **Forgetting `slot="footer"` on action buttons** — they'll end up in the body content area.
- ❌ **Not using `no-url` on `<cc-tabs>` inside modals** — tabs inside modals should not modify URL params.
- ❌ **Multiple modals open simultaneously** — design for one modal at a time.
- ❌ **Setting `open` attribute in HTML** — modal shows immediately on page load. Usually you want to open programmatically.
- ❌ **Not auto-focusing first input** — the component does this automatically, but ensure `<cc-field>` or `<input>` is the first interactive element.
