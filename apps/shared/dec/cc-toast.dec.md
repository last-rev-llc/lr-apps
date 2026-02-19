# cc-toast — DEC Spec

## Tag: `<cc-toast>`

## Purpose
Toast notification system. Renders nothing visible — provides `window.showToast()` globally.

## Attributes
None.

## Slots / Children
- None — invisible container that receives toast items.

## JS API
```js
window.showToast('Saved ✅', 3000); // message, duration in ms (default 3000)
```

## Correct Usage
```html
<!-- One per page, anywhere in body -->
<cc-toast></cc-toast>
```
```js
// After any user action
window.showToast('Item deleted', 2000);
```

## Common Mistakes (Error Corrections)

- ❌ **Forgetting `<cc-toast>` on a page** — `showToast()` calls will fail silently. Every page needs it.
- ❌ **Multiple `<cc-toast>` elements** — only one per page. Second one overwrites `window.showToast`.
- ❌ **Building custom notification UI** — always use `showToast()`. The styling comes from theme.css.
- ❌ **Calling `showToast()` before component mounts** — it queues calls via `_toastQueue`, but ensure `<cc-toast>` is in the HTML.
- ❌ **Not showing toast on errors** — every failed API call should `showToast('Error: ...')` for user feedback.
