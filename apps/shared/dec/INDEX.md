# DEC (Declarative Error Correction) — Component Index

Structured specs for every shared web component. Each DEC spec documents tag name, attributes, slots, correct usage, and common mistakes to avoid.

## How to Use
Before using any shared component, check its DEC spec. The "Common Mistakes" section captures real errors that have been made and should never be repeated.

---

## Shared Components (`apps/shared/dec/`)

| Component | File | Summary |
|-----------|------|---------|
| `<cc-app-nav>` | [cc-app-nav.dec.md](cc-app-nav.dec.md) | App navigation bar — streamlined: Logo \| Landing \| Admin \| GitHub |
| `<cc-auth>` | [cc-auth.dec.md](cc-auth.dec.md) | Password gate overlay |
| `<cc-toast>` | [cc-toast.dec.md](cc-toast.dec.md) | Toast notification system (`window.showToast`) |
| `<cc-tabs>` / `<cc-tab>` | [cc-tabs.dec.md](cc-tabs.dec.md) | Tabbed container with URL persistence |
| `<cc-sidebar>` | [cc-sidebar.dec.md](cc-sidebar.dec.md) | Vertical sidebar nav for list-detail layouts |
| `<cc-hero>` | [cc-hero.dec.md](cc-hero.dec.md) | Hero section with variants (default, split, glow) |
| `<cc-card>` | [cc-card.dec.md](cc-card.dec.md) | Card component with image, text, actions |
| `<cc-fade-in>` | [cc-fade-in.dec.md](cc-fade-in.dec.md) | Scroll-triggered fade + slide animation |
| `<cc-modal>` | [cc-modal.dec.md](cc-modal.dec.md) | Modal overlay with header, body, footer slots |
| `<cc-field>` | [cc-field.dec.md](cc-field.dec.md) | Form field (text, textarea, select, number, etc.) |
| `<cc-pill-filter>` | [cc-pill-filter.dec.md](cc-pill-filter.dec.md) | Pill filter row (prefer `<cc-pill-dropdown>` for single-select) |
| `<cc-search>` | [cc-search.dec.md](cc-search.dec.md) | Search input with focus restoration |
| `<cc-empty-state>` | [cc-empty-state.dec.md](cc-empty-state.dec.md) | Mandatory empty state with animation |
| `<cc-prefs>` | [cc-prefs.dec.md](cc-prefs.dec.md) | User preferences (Supabase + localStorage) |
| `<cc-filter-drawer>` | [cc-filter-drawer.dec.md](cc-filter-drawer.dec.md) | Slide-out filter sidebar panel |
| `<cc-edit-mode>` | [cc-edit-mode.dec.md](cc-edit-mode.dec.md) | Edit Mode overlay (auto-initialized) |
| `<cc-dev-toolbar>` | [cc-dev-toolbar.dec.md](cc-dev-toolbar.dec.md) | Dev toolbar with Edit Mode + Console Logs |

## Last Rev Marketing Components (`apps/last-rev-marketing/dec/`)

| Component | File | Summary |
|-----------|------|---------|
| `<lr-layout>` | [../../last-rev-marketing/dec/lr-layout.dec.md](../../last-rev-marketing/dec/lr-layout.dec.md) | Page layout wrapper (nav + subnav + footer) |
| `<lr-nav>` | [../../last-rev-marketing/dec/lr-nav.dec.md](../../last-rev-marketing/dec/lr-nav.dec.md) | Marketing site top navigation |
| `<lr-head>` | [../../last-rev-marketing/dec/lr-head.dec.md](../../last-rev-marketing/dec/lr-head.dec.md) | Head tag manager (meta, styles, scripts) |
| `<lr-footer>` | [../../last-rev-marketing/dec/lr-footer.dec.md](../../last-rev-marketing/dec/lr-footer.dec.md) | Site footer with contact form |
| `<lr-subnav>` | [../../last-rev-marketing/dec/lr-subnav.dec.md](../../last-rev-marketing/dec/lr-subnav.dec.md) | Floating scroll-aware section nav |

---

## Critical Rules (Cross-Component)

1. **Standalone apps** use `<cc-app-nav>` — never `<cc-topbar>`, `<cc-nav>`, or `<lr-*>` components.
2. **Last Rev Marketing pages** use `<lr-layout>` — never `<cc-app-nav>`.
3. **Every page** needs `<cc-auth>` and `<cc-toast>`.
4. **Empty states** must use `<cc-empty-state>` — never plain text.
5. **Single-select filters** → `<cc-pill-dropdown>`, not `<cc-pill-filter>`.
6. **Tabs inside modals** → always add `no-url` attribute.
7. **admin.html** must use `<cc-tabs>` with Ideas, Prompts, Ads, Docs tabs.
8. **No Shadow DOM** except `<cc-filter-drawer>`.
