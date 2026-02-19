# LR Marketing Site — Rules

## CRITICAL: No External App Links

1. **Never link to any alphaclaw.app URLs** — No links to `*.adam-harris.alphaclaw.app` or any other alphaclaw instance should appear anywhere on the site (HTML, JSON, JS, CSS). These are internal dev/staging URLs and must not leak to production.

2. **Never link to the actual demo apps** — App showcase pages should describe the apps but NOT link to them. No "Try it", "View Demo", "Open App" links pointing to live app instances. The apps section is for showcasing capabilities, not driving traffic to internal tools.

3. **Internal links only** — All links on the site should point to:
   - Other pages within the LR marketing site itself (relative paths)
   - lastrev.com (the production domain)
   - Reputable external sources (for blog citations)
   - Last Rev social profiles / contact channels

## Pre-Merge Verification

Before merging any branch (especially `dev` → `main`), run a full link audit:

```bash
# Scan all HTML/JSON/JS files for alphaclaw URLs
grep -r "alphaclaw\.app" apps/last-rev-marketing/ --include="*.html" --include="*.json" --include="*.js" -l

# Scan for any app demo links that shouldn't be there
grep -r "href=.*adam-harris\.alphaclaw" apps/last-rev-marketing/ --include="*.html" --include="*.json" -l
```

**If any matches are found: DO NOT MERGE. Fix them first.**

## Code Review Before Merge

When asked to merge dev → main:
1. Do a full code review first
2. Find issues, add inline PR comments
3. Fix all issues and push commits
4. Run the link audit above
5. Only then merge

## Other Rules

- No mention of actual client names — describe services generically
- Blog posts must follow the blog-writing skill for source verification
- All content commits go to `dev` branch, never directly to `main`
