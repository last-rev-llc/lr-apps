# Last Rev Marketing — Component Index

> Auto-reference for nightly reviews. Source of truth is always the JS files themselves.

| Component | File | Purpose | Key gotcha |
|-----------|------|---------|------------|
| `<lr-head>` | `js/lr-head.js` | Injects `<head>` meta, styles, scripts, favicon. Self-removes after. | LR marketing only. Don't add duplicate `<link>` tags. |
| `<lr-layout>` | `js/lr-layout.js` | Page wrapper: nav + subnav + children + footer. | Use this, not `<lr-nav>`/`<lr-footer>` directly. Not for standalone apps. |
| `<lr-nav>` | `js/lr-nav.js` | Top nav. Glass morphism, mobile hamburger. | Rendered by `<lr-layout>` — don't use directly. |
| `<lr-subnav>` | `js/lr-subnav.js` | Floating section nav. Scroll-activated. | Rendered by `<lr-layout subnav="...">`. Sections need matching `id`s. |
| `<lr-footer>` | `js/lr-footer.js` | Footer with contact form + links. | Rendered by `<lr-layout>` — don't use directly. |
| `<lr-app-card>` | `js/lr-app-card.js` | App showcase card for the Apps page. | — |
