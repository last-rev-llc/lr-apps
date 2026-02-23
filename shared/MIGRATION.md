# Vercel Monorepo Migration Checklist

This document outlines the steps to migrate any app from the alphaclaw single-domain pattern to the Last Rev monorepo with dual-domain support (`*.alphaclaw.app` + `*.apps.lastrev.com`).

## Overview

The monorepo uses a **meta tag base URL pattern** that allows apps to work seamlessly in both environments:
- **Alphaclaw**: Components load from `https://shared.adam-harris.alphaclaw.app/`
- **Monorepo (Vercel)**: Components load from `/shared/` (relative path)

The shared components loader (`shared/components/index.js`) checks for `<meta name="cc-base">` and falls back to script src resolution if not present.

## Migration Steps

### 1. Add `<meta name="cc-base">` Tag

Add this meta tag to all HTML pages in the app:

```html
<!-- For alphaclaw deployment -->
<meta name="cc-base" content="https://shared.adam-harris.alphaclaw.app/">

<!-- For monorepo deployment (change to this after migration) -->
<meta name="cc-base" content="/shared/">
```

**Where to add it:**
- In `<head>` before loading any component scripts
- If using a component like `<lr-head>`, add it in the component's `connectedCallback()` using `setMeta('name', 'cc-base', '...')`

**Important:** The base URL must end with `/` — the loader appends `components/` to it.

### 2. Verify Shared Component References

Ensure all shared component and asset references use the loader pattern, not hardcoded URLs:

✅ **Good:**
```html
<script src="https://shared.adam-harris.alphaclaw.app/components/index.js"></script>
<link rel="stylesheet" href="../shared/theme.css">
```

❌ **Bad (hardcoded):**
```html
<script src="https://shared.adam-harris.alphaclaw.app/components/cc-card.js"></script>
<script src="https://some-other-cdn.com/components/cc-modal.js"></script>
```

The barrel loader (`components/index.js`) resolves all component paths dynamically based on the meta tag.

### 3. Test on Alphaclaw

Before migrating, test that the app works correctly on alphaclaw with the meta tag:

```bash
# Deploy to alphaclaw
cd ~/workspace/adam-harris/apps/YOUR-APP-NAME
# (app auto-deploys to https://YOUR-APP-NAME.adam-harris.alphaclaw.app)

# Open in browser and verify:
# - Components load correctly
# - Theme/styles are applied
# - No 404s in Network tab
```

### 4. Add to `lr-apps` Monorepo

Copy the app directory to the monorepo:

```bash
# In the lr-apps repo
cd /tmp/lr-apps/apps/
cp -r ~/workspace/adam-harris/apps/YOUR-APP-NAME ./YOUR-APP-NAME/
```

### 5. Add Vercel Rewrites

The `vercel.json` is auto-generated and includes rewrites for all apps in `apps/`.

To regenerate it after adding a new app:

```bash
cd /tmp/lr-apps
node /tmp/generate-vercel-config.js > vercel.json
```

Or manually add two rewrites per app:

```json
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "your-app-name.adam-harris.alphaclaw.app" }],
  "destination": "/apps/your-app-name/:path*"
},
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "your-app-name.apps.lastrev.com" }],
  "destination": "/apps/your-app-name/:path*"
}
```

### 6. Update Meta Tag for Monorepo

After confirming the app is in the monorepo, update the `<meta name="cc-base">` value:

```html
<!-- Change FROM: -->
<meta name="cc-base" content="https://shared.adam-harris.alphaclaw.app/">

<!-- TO: -->
<meta name="cc-base" content="/shared/">
```

This makes the app load components from the monorepo's root `/shared/` directory.

### 7. Remove Vendored Shared Components (if present)

If the app has a `shared/` or `components/` directory that vendors copies of the shared library:

```bash
# In the app directory
rm -rf shared/components/
rm -rf shared/theme.css
# Keep any app-specific files in shared/ that aren't from the central library
```

Update `components.json` (if present) to document that the app no longer vendors shared components.

### 8. Remove Pre-Commit Hook (if present)

If the app has a `.githooks/pre-commit` script that syncs shared components:

```bash
rm -rf .githooks/
```

This is no longer needed since the monorepo has a single source of truth at `/shared/`.

### 9. Test on Vercel Preview

Push to the monorepo and test the Vercel preview deployment:

```bash
git add .
git commit -m "Add YOUR-APP-NAME to monorepo"
git push origin main

# Vercel will auto-deploy a preview
# Test at: https://lr-apps-git-main-last-rev.vercel.app/
# Or app-specific: https://YOUR-APP-NAME.apps.lastrev.com (once DNS is configured)
```

### 10. Configure DNS (Production Only)

For production `*.apps.lastrev.com` domains:

1. Add CNAME record: `*.apps.lastrev.com` → `cname.vercel-dns.com`
2. Configure Vercel project to accept `*.apps.lastrev.com` domains
3. Verify SSL certificates are issued

## Checklist Template

Use this when migrating an app:

- [ ] Add `<meta name="cc-base" content="https://shared.adam-harris.alphaclaw.app/">` to all HTML pages
- [ ] Verify all shared component references use the loader (no hardcoded URLs)
- [ ] Test on alphaclaw (no errors, components load correctly)
- [ ] Copy app to `/tmp/lr-apps/apps/YOUR-APP-NAME/`
- [ ] Regenerate `vercel.json` or add manual rewrites
- [ ] Update meta tag to `content="/shared/"` for monorepo
- [ ] Remove vendored `shared/` directory (if present)
- [ ] Remove `.githooks/pre-commit` (if present)
- [ ] Update `components.json` to document no vendoring
- [ ] Test on Vercel preview deployment
- [ ] Configure DNS for `*.apps.lastrev.com` (production only)

## Example: last-rev-marketing

The `last-rev-marketing` app is a good reference:

- **Meta tag**: Injected via `js/lr-head.js` component
- **Vendored components**: Yes (in `shared/components/`) — to be removed in monorepo
- **Pre-commit hook**: Yes (`.githooks/pre-commit` syncs shared components) — to be removed
- **Components.json**: Documents vendoring strategy

After migration:
- Meta tag changes from `https://shared.adam-harris.alphaclaw.app/` to `/shared/`
- Remove `shared/components/` vendoring
- Remove `.githooks/pre-commit`
- Update `components.json`

## Troubleshooting

**Components don't load in monorepo:**
- Check that `<meta name="cc-base">` is present and correct (`/shared/` with trailing slash)
- Verify `/shared/components/` exists at monorepo root
- Check browser Network tab for 404s

**Theme styles missing:**
- Ensure `<link rel="stylesheet" href="/shared/theme.css">` uses correct path
- Check that `/shared/theme.css` exists at monorepo root

**Works on alphaclaw but not monorepo:**
- Likely a hardcoded URL to `https://shared.adam-harris.alphaclaw.app/`
- Search codebase for absolute URLs and replace with relative paths

## Architecture Notes

### Why Meta Tag Pattern?

The meta tag pattern allows a single codebase to work in both environments:

1. **Alphaclaw**: Uses absolute URLs to `shared.adam-harris.alphaclaw.app`
2. **Monorepo**: Uses relative paths to `/shared/`

The `components/index.js` loader checks for the meta tag first, then falls back to script src resolution (existing behavior).

### Directory Structure

**Monorepo:**
```
lr-apps/
├── shared/              ← Shared library at root
│   ├── components/
│   ├── theme.css
│   ├── landing.css
│   └── ...
├── apps/
│   ├── shared/          ← Backwards compat copy
│   ├── app-one/
│   ├── app-two/
│   └── ...
└── vercel.json          ← Dual-domain rewrites
```

**Alphaclaw Workspace:**
```
~/workspace/adam-harris/apps/
├── shared/              ← Source of truth
│   ├── components/
│   ├── theme.css
│   └── ...
├── app-one/
├── app-two/
└── ...
```

### Deployment Flow

1. **Development**: Edit `~/workspace/adam-harris/apps/shared/` (source of truth)
2. **Alphaclaw Deploy**: Auto-deploys to `https://shared.adam-harris.alphaclaw.app/`
3. **Monorepo Sync**: Copy changes to `/tmp/lr-apps/shared/` and `/tmp/lr-apps/apps/shared/`
4. **Vercel Deploy**: Push to GitHub, Vercel builds and deploys

---

**Last Updated:** 2026-02-23  
**Maintainer:** Adam Harris / OpenClaw Agent
