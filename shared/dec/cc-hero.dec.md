# cc-hero — DEC Spec

## Tag: `<cc-hero>`

## Purpose
Hero section for landing pages and feature headers. Supports multiple layout variants.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | ✅ | `""` | Hero heading |
| `subtitle` | string | — | `""` | Subheading text |
| `body` | string | — | `""` | Body paragraph text |
| `overline` | string | — | `""` | Small uppercase text above title |
| `image` | string | — | `""` | Image URL |
| `variant` | string | — | `"default"` | `"default"` \| `"split"` \| `"glow"` |
| `align` | string | — | `"center"` | Text alignment: `"center"` \| `"left"` |
| `height` | string | — | `"full"` | Height mode: `"full"` (100vh) \| `"medium"` (50vh) \| `"fit"` (auto, padding only) |

## Slots
- `slot="actions"` — CTA buttons placed below the text content.

## Correct Usage
```html
<cc-hero
  title="Welcome to Recipes"
  subtitle="Your personal cookbook"
  overline="NEW"
  variant="glow"
>
  <div slot="actions">
    <a href="#start" class="btn btn-primary">Get Started</a>
  </div>
</cc-hero>
```

```html
<!-- Split layout with image -->
<cc-hero title="About Us" subtitle="Our story" image="hero.jpg" variant="split" align="left"></cc-hero>
```

## Common Mistakes (Error Corrections)

- ❌ **Building custom hero sections with raw HTML** — use `<cc-hero>` with the right variant.
- ❌ **Putting CTA buttons as plain children** — use `slot="actions"` for proper placement.
- ❌ **Using `variant="split"` without `image`** — split variant requires an image.
- ❌ **Inline styles for hero text sizing** — the component handles responsive typography with `clamp()`.
- ❌ **Using `<cc-hero>` on non-landing pages** — heroes belong on landing.html, not index.html/admin.html.
