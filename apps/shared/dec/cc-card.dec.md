# cc-card — DEC Spec

## Tag: `<cc-card>`

## Purpose
Reusable card component with image, text content, and action slots. Supports vertical/horizontal layouts and multiple visual variants.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | — | `""` | Card heading |
| `overline` | string | — | `""` | Small uppercase label above title |
| `subtitle` | string | — | `""` | Subtitle below title |
| `body` | string | — | `""` | Body text |
| `href` | string | — | `""` | Makes the card a clickable link |
| `image` | string | — | `""` | Image URL |
| `variant` | string | — | `"default"` | `"default"` \| `"glass"` \| `"outline"` |
| `layout` | string | — | `"vertical"` | `"vertical"` \| `"horizontal"` |

## Slots
- `slot="actions"` — action buttons in the card footer.

## Correct Usage
```html
<cc-card title="Feature X" subtitle="Quick summary" body="Detailed description" variant="glass">
  <div slot="actions">
    <button class="btn btn-primary">Learn More</button>
  </div>
</cc-card>
```

```html
<!-- Clickable card -->
<cc-card title="Blog Post" body="Read more..." href="/blog/post-1" image="thumb.jpg"></cc-card>
```

## Common Mistakes (Error Corrections)

- ❌ **Using raw `.card` divs when `<cc-card>` would work** — prefer the component for consistent styling.
- ❌ **Forgetting `slot="actions"` on CTA buttons** — plain children get mixed into body content.
- ❌ **Using `layout="horizontal"` without testing mobile** — it auto-stacks on screens ≤600px.
- ❌ **Inline card styles** — use `variant` attribute for visual variants, not custom CSS.
