# cc-fade-in — DEC Spec

## Tag: `<cc-fade-in>`

## Purpose
Scroll-triggered fade + slide animation wrapper. Wraps any content and animates it into view.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `delay` | number (ms) | — | `0` | Delay before animation starts |
| `duration` | number (ms) | — | `700` | Animation duration |
| `direction` | string | — | `"up"` | `"up"` \| `"down"` \| `"left"` \| `"right"` |
| `distance` | number (px) | — | `30` | Slide distance |
| `threshold` | number | — | `0.15` | IntersectionObserver threshold (0–1) |

## Slots / Children
- Default slot — any content to animate.

## Correct Usage
```html
<cc-fade-in>
  <div class="page-header"><h1>Welcome</h1></div>
</cc-fade-in>

<cc-fade-in direction="left" delay="200" distance="40">
  <div class="card">Content</div>
</cc-fade-in>
```

## Common Mistakes (Error Corrections)

- ❌ **Writing custom `@keyframes` fade-in animations** — use `<cc-fade-in>` instead.
- ❌ **Using CSS units in `delay`/`duration`/`distance`** — these are raw numbers (ms or px). Not `"200ms"` or `"30px"`.
- ❌ **Wrapping every tiny element** — wrap sections/cards, not individual text nodes.
- ❌ **Using on admin/data pages** — fade-in is primarily for landing pages and marketing content. Data pages should load content instantly.
